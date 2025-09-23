package utils

import (
	"errors"
	"fmt"
	"reflect"
	"regexp"
	"strings"

	"github.com/gofiber/fiber/v2"
)

var (
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
)

// ValidationError represents a validation error
type ValidationError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
	Value   interface{} `json:"value,omitempty"`
}

type ValidationErrors []ValidationError

func (ve ValidationErrors) Error() string {
	var messages []string
	for _, err := range ve {
		messages = append(messages, fmt.Sprintf("%s: %s", err.Field, err.Message))
	}
	return strings.Join(messages, ", ")
}

// ValidateStruct validates a struct based on validation tags
func ValidateStruct(s interface{}) error {
	v := reflect.ValueOf(s)
	t := reflect.TypeOf(s)

	// Handle pointer types
	if v.Kind() == reflect.Ptr {
		if v.IsNil() {
			return errors.New("cannot validate nil pointer")
		}
		v = v.Elem()
		t = t.Elem()
	}

	if v.Kind() != reflect.Struct {
		return errors.New("can only validate structs")
	}

	var validationErrors ValidationErrors

	for i := 0; i < v.NumField(); i++ {
		field := v.Field(i)
		fieldType := t.Field(i)
		
		// Skip unexported fields
		if !field.CanInterface() {
			continue
		}

		validationTag := fieldType.Tag.Get("validate")
		if validationTag == "" {
			continue
		}

		fieldName := getFieldName(fieldType)
		fieldValue := field.Interface()

		// Parse validation rules
		rules := parseValidationRules(validationTag)
		
		for _, rule := range rules {
			if err := validateField(fieldName, fieldValue, rule, field); err != nil {
				validationErrors = append(validationErrors, *err)
			}
		}
	}

	if len(validationErrors) > 0 {
		return validationErrors
	}

	return nil
}

func getFieldName(field reflect.StructField) string {
	if jsonTag := field.Tag.Get("json"); jsonTag != "" {
		// Use JSON tag name if available
		parts := strings.Split(jsonTag, ",")
		if parts[0] != "" && parts[0] != "-" {
			return parts[0]
		}
	}
	return strings.ToLower(field.Name)
}

func parseValidationRules(tag string) []string {
	return strings.Split(tag, ",")
}

func validateField(fieldName string, value interface{}, rule string, field reflect.Value) *ValidationError {
	parts := strings.Split(rule, "=")
	ruleName := parts[0]
	var ruleValue string
	if len(parts) > 1 {
		ruleValue = parts[1]
	}

	switch ruleName {
	case "required":
		if isEmpty(field) {
			return &ValidationError{
				Field:   fieldName,
				Message: "This field is required",
				Value:   value,
			}
		}

	case "email":
		if str, ok := value.(string); ok && str != "" {
			if !emailRegex.MatchString(str) {
				return &ValidationError{
					Field:   fieldName,
					Message: "Must be a valid email address",
					Value:   value,
				}
			}
		}

	case "min":
		if err := validateMin(fieldName, value, ruleValue, field); err != nil {
			return err
		}

	case "max":
		if err := validateMax(fieldName, value, ruleValue, field); err != nil {
			return err
		}

	case "oneof":
		if str, ok := value.(string); ok && str != "" {
			allowed := strings.Split(ruleValue, " ")
			found := false
			for _, allowed := range allowed {
				if str == allowed {
					found = true
					break
				}
			}
			if !found {
				return &ValidationError{
					Field:   fieldName,
					Message: fmt.Sprintf("Must be one of: %s", strings.Join(allowed, ", ")),
					Value:   value,
				}
			}
		}
	}

	return nil
}

func isEmpty(field reflect.Value) bool {
	switch field.Kind() {
	case reflect.String:
		return field.String() == ""
	case reflect.Slice, reflect.Map, reflect.Array:
		return field.Len() == 0
	case reflect.Ptr, reflect.Interface:
		return field.IsNil()
	default:
		return field.IsZero()
	}
}

func validateMin(fieldName string, value interface{}, ruleValue string, field reflect.Value) *ValidationError {
	switch field.Kind() {
	case reflect.String:
		if str, ok := value.(string); ok {
			if minLen := parseInt(ruleValue); minLen > 0 && len(str) < minLen {
				return &ValidationError{
					Field:   fieldName,
					Message: fmt.Sprintf("Must be at least %d characters long", minLen),
					Value:   value,
				}
			}
		}
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		if minVal := parseInt(ruleValue); minVal > 0 && field.Int() < int64(minVal) {
			return &ValidationError{
				Field:   fieldName,
				Message: fmt.Sprintf("Must be at least %d", minVal),
				Value:   value,
			}
		}
	case reflect.Float32, reflect.Float64:
		if minVal := parseFloat(ruleValue); minVal > 0 && field.Float() < minVal {
			return &ValidationError{
				Field:   fieldName,
				Message: fmt.Sprintf("Must be at least %g", minVal),
				Value:   value,
			}
		}
	}
	return nil
}

func validateMax(fieldName string, value interface{}, ruleValue string, field reflect.Value) *ValidationError {
	switch field.Kind() {
	case reflect.String:
		if str, ok := value.(string); ok {
			if maxLen := parseInt(ruleValue); maxLen > 0 && len(str) > maxLen {
				return &ValidationError{
					Field:   fieldName,
					Message: fmt.Sprintf("Must be no more than %d characters long", maxLen),
					Value:   value,
				}
			}
		}
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		if maxVal := parseInt(ruleValue); maxVal > 0 && field.Int() > int64(maxVal) {
			return &ValidationError{
				Field:   fieldName,
				Message: fmt.Sprintf("Must be no more than %d", maxVal),
				Value:   value,
			}
		}
	case reflect.Float32, reflect.Float64:
		if maxVal := parseFloat(ruleValue); maxVal > 0 && field.Float() > maxVal {
			return &ValidationError{
				Field:   fieldName,
				Message: fmt.Sprintf("Must be no more than %g", maxVal),
				Value:   value,
			}
		}
	}
	return nil
}

func parseInt(s string) int {
	var result int
	fmt.Sscanf(s, "%d", &result)
	return result
}

func parseFloat(s string) float64 {
	var result float64
	fmt.Sscanf(s, "%f", &result)
	return result
}

// ValidateRequest validates request body and returns fiber error if validation fails
func ValidateRequest(c *fiber.Ctx, req interface{}) error {
	if err := c.BodyParser(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"code":    "INVALID_REQUEST_BODY",
			"message": "Invalid request body format",
			"details": err.Error(),
		})
	}

	if err := ValidateStruct(req); err != nil {
		if validationErrors, ok := err.(ValidationErrors); ok {
			return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{
				"code":    "VALIDATION_ERROR",
				"message": "Request validation failed",
				"errors":  validationErrors,
			})
		}
		
		return c.Status(fiber.StatusUnprocessableEntity).JSON(fiber.Map{
			"code":    "VALIDATION_ERROR",
			"message": "Request validation failed",
			"details": err.Error(),
		})
	}

	return nil
}
