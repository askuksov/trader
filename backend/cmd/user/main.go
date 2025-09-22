package main

import (
	"bufio"
	"errors"
	"fmt"
	"log/slog"
	"os"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unicode"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
	"gorm.io/gorm"

	"trader/internal/config"
	"trader/internal/database"
	"trader/internal/models"

	"github.com/spf13/cobra"
)

var (
	cfg *config.Config
	db  *database.Database
)

func main() {
	// Initialize configuration
	cfg = config.Load()

	// Connect to database
	var err error
	db, err = database.NewDatabase(cfg)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer db.Close()

	// Setup root command
	var rootCmd = &cobra.Command{
		Use:   "user",
		Short: "User management tool for the trading bot",
		Long:  `Console tool for managing users, roles, and permissions in the trading bot system.`,
	}

	// Add commands
	rootCmd.AddCommand(
		createCmd(),
		listCmd(),
		showCmd(),
		updateCmd(),
		activateCmd(),
		deactivateCmd(),
		deleteCmd(),
		setRoleCmd(),
		removeRoleCmd(),
		rolesCmd(),
		grantPermissionCmd(),
		revokePermissionCmd(),
		permissionsCmd(),
		resetPasswordCmd(),
		unlockCmd(),
		listRolesCmd(),
		listPermissionsCmd(),
	)

	// Execute command
	if err := rootCmd.Execute(); err != nil {
		slog.Error("command execution failed", "error", err)
		os.Exit(1)
	}
}

// Create user command
func createCmd() *cobra.Command {
	var (
		email     string
		firstName string
		lastName  string
		role      string
	)

	cmd := &cobra.Command{
		Use:   "create",
		Short: "Create a new user",
		Long:  `Create a new user with interactive password input.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return createUser(email, firstName, lastName, role)
		},
	}

	cmd.Flags().StringVarP(&email, "email", "e", "", "User email (required)")
	cmd.Flags().StringVar(&firstName, "first-name", "", "User first name")
	cmd.Flags().StringVar(&lastName, "last-name", "", "User last name")
	cmd.Flags().StringVar(&role, "role", "trader", "User role (default: trader)")

	cmd.MarkFlagRequired("email")

	return cmd
}

// List users command
func listCmd() *cobra.Command {
	var (
		roleFilter   string
		activeFilter string
		limit        int
		offset       int
	)

	cmd := &cobra.Command{
		Use:   "list",
		Short: "List users",
		Long:  `List users with optional filtering.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return listUsers(roleFilter, activeFilter, limit, offset)
		},
	}

	cmd.Flags().StringVar(&roleFilter, "role", "", "Filter by role")
	cmd.Flags().StringVar(&activeFilter, "active", "", "Filter by active status (true/false)")
	cmd.Flags().IntVar(&limit, "limit", 10, "Number of users to return")
	cmd.Flags().IntVar(&offset, "offset", 0, "Number of users to skip")

	return cmd
}

// Show user command
func showCmd() *cobra.Command {
	var (
		userID uint64
		email  string
	)

	cmd := &cobra.Command{
		Use:   "show",
		Short: "Show user details",
		Long:  `Show detailed information about a specific user.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if userID == 0 && email == "" {
				return fmt.Errorf("either --id or --email must be provided")
			}
			return showUser(userID, email)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID")
	cmd.Flags().StringVar(&email, "email", "", "User email")

	return cmd
}

// Update user command
func updateCmd() *cobra.Command {
	var (
		userID    uint64
		email     string
		firstName string
		lastName  string
		active    string
	)

	cmd := &cobra.Command{
		Use:   "update",
		Short: "Update user information",
		Long:  `Update user information. Only provided fields will be updated.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			if userID == 0 {
				return fmt.Errorf("--id is required")
			}
			return updateUser(userID, email, firstName, lastName, active)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.Flags().StringVar(&email, "email", "", "New email")
	cmd.Flags().StringVar(&firstName, "first-name", "", "New first name")
	cmd.Flags().StringVar(&lastName, "last-name", "", "New last name")
	cmd.Flags().StringVar(&active, "active", "", "Active status (true/false)")

	cmd.MarkFlagRequired("id")

	return cmd
}

// Activate user command
func activateCmd() *cobra.Command {
	var userID uint64

	cmd := &cobra.Command{
		Use:   "activate",
		Short: "Activate user",
		Long:  `Activate a user account.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return activateUser(userID)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.MarkFlagRequired("id")

	return cmd
}

// Deactivate user command
func deactivateCmd() *cobra.Command {
	var userID uint64

	cmd := &cobra.Command{
		Use:   "deactivate",
		Short: "Deactivate user",
		Long:  `Deactivate a user account.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return deactivateUser(userID)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.MarkFlagRequired("id")

	return cmd
}

// Delete user command
func deleteCmd() *cobra.Command {
	var userID uint64

	cmd := &cobra.Command{
		Use:   "delete",
		Short: "Delete user (soft delete)",
		Long:  `Soft delete a user account.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return deleteUser(userID)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.MarkFlagRequired("id")

	return cmd
}

// Set role command
func setRoleCmd() *cobra.Command {
	var (
		userID uint64
		role   string
	)

	cmd := &cobra.Command{
		Use:   "set-role",
		Short: "Assign role to user",
		Long:  `Assign a role to a user. This will replace existing roles.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return setUserRole(userID, role)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.Flags().StringVar(&role, "role", "", "Role name (required)")

	cmd.MarkFlagRequired("id")
	cmd.MarkFlagRequired("role")

	return cmd
}

// Remove role command
func removeRoleCmd() *cobra.Command {
	var (
		userID uint64
		role   string
	)

	cmd := &cobra.Command{
		Use:   "remove-role",
		Short: "Remove role from user",
		Long:  `Remove a role from a user.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return removeUserRole(userID, role)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.Flags().StringVar(&role, "role", "", "Role name (required)")

	cmd.MarkFlagRequired("id")
	cmd.MarkFlagRequired("role")

	return cmd
}

// List user roles command
func rolesCmd() *cobra.Command {
	var userID uint64

	cmd := &cobra.Command{
		Use:   "roles",
		Short: "List user roles",
		Long:  `List all roles assigned to a user.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return listUserRoles(userID)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.MarkFlagRequired("id")

	return cmd
}

// Grant permission command
func grantPermissionCmd() *cobra.Command {
	var (
		userID     uint64
		permission string
		allow      bool
	)

	cmd := &cobra.Command{
		Use:   "grant-permission",
		Short: "Grant direct permission to user",
		Long:  `Grant or deny a direct permission to a user.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return grantUserPermission(userID, permission, allow)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.Flags().StringVar(&permission, "permission", "", "Permission (resource:action format, required)")
	cmd.Flags().BoolVar(&allow, "allow", true, "Allow permission (default: true)")

	cmd.MarkFlagRequired("id")
	cmd.MarkFlagRequired("permission")

	return cmd
}

// Revoke permission command
func revokePermissionCmd() *cobra.Command {
	var (
		userID     uint64
		permission string
	)

	cmd := &cobra.Command{
		Use:   "revoke-permission",
		Short: "Revoke direct permission from user",
		Long:  `Remove a direct permission from a user.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return revokeUserPermission(userID, permission)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.Flags().StringVar(&permission, "permission", "", "Permission (resource:action format, required)")

	cmd.MarkFlagRequired("id")
	cmd.MarkFlagRequired("permission")

	return cmd
}

// List user permissions command
func permissionsCmd() *cobra.Command {
	var userID uint64

	cmd := &cobra.Command{
		Use:   "permissions",
		Short: "List user permissions",
		Long:  `List all effective permissions for a user (from roles and direct permissions).`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return listUserPermissions(userID)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.MarkFlagRequired("id")

	return cmd
}

// Reset password command
func resetPasswordCmd() *cobra.Command {
	var userID uint64

	cmd := &cobra.Command{
		Use:   "reset-password",
		Short: "Reset user password",
		Long:  `Reset user password with interactive input.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return resetUserPassword(userID)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.MarkFlagRequired("id")

	return cmd
}

// Unlock user command
func unlockCmd() *cobra.Command {
	var userID uint64

	cmd := &cobra.Command{
		Use:   "unlock",
		Short: "Unlock user account",
		Long:  `Unlock a locked user account and reset login attempts.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return unlockUser(userID)
		},
	}

	cmd.Flags().Uint64Var(&userID, "id", 0, "User ID (required)")
	cmd.MarkFlagRequired("id")

	return cmd
}

// List all roles command
func listRolesCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list-roles",
		Short: "List all available roles",
		Long:  `List all roles available in the system.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return listAllRoles()
		},
	}

	return cmd
}

// List all permissions command
func listPermissionsCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "list-permissions",
		Short: "List all available permissions",
		Long:  `List all permissions available in the system.`,
		RunE: func(cmd *cobra.Command, args []string) error {
			return listAllPermissions()
		},
	}

	return cmd
}

// Interactive password input
func promptPassword(prompt string) (string, error) {
	fmt.Print(prompt)
	password, err := term.ReadPassword(int(syscall.Stdin))
	if err != nil {
		return "", err
	}
	fmt.Println() // Print newline after hidden input
	return string(password), nil
}

// Email validation
func isValidEmail(email string) bool {
	emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	return emailRegex.MatchString(email)
}

// Password validation
func validatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	hasUpper := false
	hasLower := false
	hasDigit := false

	for _, char := range password {
		if unicode.IsUpper(char) {
			hasUpper = true
		}
		if unicode.IsLower(char) {
			hasLower = true
		}
		if unicode.IsDigit(char) {
			hasDigit = true
		}
	}

	if !hasUpper {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}
	if !hasLower {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}
	if !hasDigit {
		return fmt.Errorf("password must contain at least one digit")
	}

	return nil
}

// Hash password
func hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), cfg.Security.BcryptCost)
	return string(bytes), err
}

// Validate role
func validateRole(roleName string) error {
	var role models.Role
	if err := db.MySQL.Where("name = ? AND is_active = ?", roleName, true).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("role '%s' not found or inactive", roleName)
		}
		return fmt.Errorf("failed to validate role: %w", err)
	}
	return nil
}

// Parse permission
func parsePermission(permStr string) (string, string, error) {
	parts := strings.Split(permStr, ":")
	if len(parts) != 2 {
		return "", "", fmt.Errorf("permission must be in 'resource:action' format")
	}
	return parts[0], parts[1], nil
}

// Prompt for confirmation
func promptConfirmation(message string) bool {
	fmt.Printf("%s (y/N): ", message)
	reader := bufio.NewReader(os.Stdin)
	response, _ := reader.ReadString('\n')
	response = strings.ToLower(strings.TrimSpace(response))
	return response == "y" || response == "yes"
}

// Implementation functions will be added next...

// Create user implementation
func createUser(email, firstName, lastName, roleName string) error {
	// Validate email
	if !isValidEmail(email) {
		return fmt.Errorf("invalid email format")
	}

	// Check if user exists
	var existingUser models.User
	if err := db.MySQL.Where("email = ?", email).First(&existingUser).Error; err == nil {
		return fmt.Errorf("user with email '%s' already exists", email)
	}

	// Validate role
	if err := validateRole(roleName); err != nil {
		return err
	}

	// Get password interactively
	password, err := promptPassword("Password: ")
	if err != nil {
		return fmt.Errorf("failed to read password: %w", err)
	}

	confirmPassword, err := promptPassword("Confirm password: ")
	if err != nil {
		return fmt.Errorf("failed to read password confirmation: %w", err)
	}

	if password != confirmPassword {
		return fmt.Errorf("passwords do not match")
	}

	// Validate password
	if err := validatePassword(password); err != nil {
		return err
	}

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user in transaction
	tx := db.MySQL.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	user := models.User{
		Email:        email,
		FirstName:    firstName,
		LastName:     lastName,
		PasswordHash: hashedPassword,
		IsActive:     true,
	}

	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to create user: %w", err)
	}

	// Assign role
	var role models.Role
	if err := tx.Where("name = ?", roleName).First(&role).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to find role: %w", err)
	}

	userRole := models.UserRole{
		UserID:     user.ID,
		RoleID:     role.ID,
		AssignedAt: time.Now(),
	}

	if err := tx.Create(&userRole).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to assign role: %w", err)
	}

	tx.Commit()

	fmt.Printf("✅ User created successfully:\n")
	fmt.Printf("   ID: %d\n", user.ID)
	fmt.Printf("   Email: %s\n", user.Email)
	fmt.Printf("   Name: %s %s\n", user.FirstName, user.LastName)
	fmt.Printf("   Role: %s\n", roleName)
	fmt.Printf("   Active: %t\n", user.IsActive)
	fmt.Printf("   Created: %s\n", user.CreatedAt.Format(time.RFC3339))

	return nil
}

func listUsers(roleFilter, activeFilter string, limit, offset int) error {
	query := db.MySQL.Preload("Roles")

	// Apply filters
	if roleFilter != "" {
		query = query.Joins("JOIN user_roles ON users.id = user_roles.user_id").
			Joins("JOIN roles ON user_roles.role_id = roles.id").
			Where("roles.name = ?", roleFilter)
	}

	if activeFilter != "" {
		if active, err := strconv.ParseBool(activeFilter); err == nil {
			query = query.Where("is_active = ?", active)
		}
	}

	var users []models.User
	if err := query.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return fmt.Errorf("failed to list users: %w", err)
	}

	if len(users) == 0 {
		fmt.Println("No users found.")
		return nil
	}

	fmt.Printf("Found %d users:\n\n", len(users))
	for _, user := range users {
		roleNames := make([]string, len(user.Roles))
		for i, role := range user.Roles {
			roleNames[i] = role.Name
		}

		fmt.Printf("ID: %d\n", user.ID)
		fmt.Printf("Email: %s\n", user.Email)
		fmt.Printf("Name: %s %s\n", user.FirstName, user.LastName)
		fmt.Printf("Roles: %s\n", strings.Join(roleNames, ", "))
		fmt.Printf("Active: %t\n", user.IsActive)
		if user.LastLoginAt != nil {
			fmt.Printf("Last Login: %s\n", user.LastLoginAt.Format(time.RFC3339))
		}
		fmt.Printf("Created: %s\n", user.CreatedAt.Format(time.RFC3339))
		fmt.Println("---")
	}

	return nil
}

func showUser(userID uint64, email string) error {
	var user models.User
	query := db.MySQL.Preload("Roles").Preload("Permissions.Permission")

	if userID != 0 {
		query = query.Where("id = ?", userID)
	} else {
		query = query.Where("email = ?", email)
	}

	if err := query.First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	fmt.Printf("User Details:\n")
	fmt.Printf("ID: %d\n", user.ID)
	fmt.Printf("Email: %s\n", user.Email)
	fmt.Printf("Name: %s %s\n", user.FirstName, user.LastName)
	fmt.Printf("Active: %t\n", user.IsActive)
	fmt.Printf("Email Verified: %t\n", user.EmailVerified)
	if user.LastLoginAt != nil {
		fmt.Printf("Last Login: %s\n", user.LastLoginAt.Format(time.RFC3339))
	}
	if user.IsLocked() {
		fmt.Printf("⚠️  Account Locked Until: %s\n", user.LockedUntil.Format(time.RFC3339))
	}
	fmt.Printf("Created: %s\n", user.CreatedAt.Format(time.RFC3339))
	fmt.Printf("Updated: %s\n", user.UpdatedAt.Format(time.RFC3339))

	// Show roles
	if len(user.Roles) > 0 {
		fmt.Printf("\nRoles:\n")
		for _, role := range user.Roles {
			fmt.Printf("  - %s: %s\n", role.Name, role.Description)
		}
	}

	// Show direct permissions
	if len(user.Permissions) > 0 {
		fmt.Printf("\nDirect Permissions:\n")
		for _, userPerm := range user.Permissions {
			status := "✅"
			if !userPerm.Allow {
				status = "❌"
			}
			fmt.Printf("  %s %s:%s\n", status, userPerm.Permission.Resource, userPerm.Permission.Action)
		}
	}

	return nil
}

func updateUser(userID uint64, email, firstName, lastName, active string) error {
	var user models.User
	if err := db.MySQL.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	updates := make(map[string]interface{})

	if email != "" {
		if !isValidEmail(email) {
			return fmt.Errorf("invalid email format")
		}
		updates["email"] = email
	}

	if firstName != "" {
		updates["first_name"] = firstName
	}

	if lastName != "" {
		updates["last_name"] = lastName
	}

	if active != "" {
		if activeVal, err := strconv.ParseBool(active); err == nil {
			updates["is_active"] = activeVal
		} else {
			return fmt.Errorf("invalid active value, must be true or false")
		}
	}

	if len(updates) == 0 {
		return fmt.Errorf("no fields to update")
	}

	if err := db.MySQL.Model(&user).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update user: %w", err)
	}

	fmt.Printf("✅ User updated successfully (ID: %d)\n", userID)
	return nil
}

func activateUser(userID uint64) error {
	result := db.MySQL.Model(&models.User{}).Where("id = ?", userID).Update("is_active", true)
	if result.Error != nil {
		return fmt.Errorf("failed to activate user: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("user not found")
	}
	fmt.Printf("✅ User activated successfully (ID: %d)\n", userID)
	return nil
}

func deactivateUser(userID uint64) error {
	result := db.MySQL.Model(&models.User{}).Where("id = ?", userID).Update("is_active", false)
	if result.Error != nil {
		return fmt.Errorf("failed to deactivate user: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("user not found")
	}
	fmt.Printf("✅ User deactivated successfully (ID: %d)\n", userID)
	return nil
}

func deleteUser(userID uint64) error {
	var user models.User
	if err := db.MySQL.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	if !promptConfirmation(fmt.Sprintf("Are you sure you want to delete user '%s' (ID: %d)?", user.Email, userID)) {
		fmt.Println("Operation cancelled.")
		return nil
	}

	if err := db.MySQL.Delete(&user).Error; err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	fmt.Printf("✅ User deleted successfully (ID: %d)\n", userID)
	return nil
}

func setUserRole(userID uint64, roleName string) error {
	// Validate user exists
	var user models.User
	if err := db.MySQL.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Validate role exists
	var role models.Role
	if err := db.MySQL.Where("name = ? AND is_active = ?", roleName, true).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("role '%s' not found or inactive", roleName)
		}
		return fmt.Errorf("failed to get role: %w", err)
	}

	tx := db.MySQL.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Remove existing roles
	if err := tx.Where("user_id = ?", userID).Delete(&models.UserRole{}).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to remove existing roles: %w", err)
	}

	// Add new role
	userRole := models.UserRole{
		UserID:     uint(userID),
		RoleID:     role.ID,
		AssignedAt: time.Now(),
	}

	if err := tx.Create(&userRole).Error; err != nil {
		tx.Rollback()
		return fmt.Errorf("failed to assign role: %w", err)
	}

	tx.Commit()

	fmt.Printf("✅ Role '%s' assigned to user %d\n", roleName, userID)
	return nil
}

func removeUserRole(userID uint64, roleName string) error {
	// Get role ID
	var role models.Role
	if err := db.MySQL.Where("name = ?", roleName).First(&role).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("role '%s' not found", roleName)
		}
		return fmt.Errorf("failed to get role: %w", err)
	}

	result := db.MySQL.Where("user_id = ? AND role_id = ?", userID, role.ID).Delete(&models.UserRole{})
	if result.Error != nil {
		return fmt.Errorf("failed to remove role: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("user does not have role '%s'", roleName)
	}

	fmt.Printf("✅ Role '%s' removed from user %d\n", roleName, userID)
	return nil
}

func listUserRoles(userID uint64) error {
	var user models.User
	if err := db.MySQL.Preload("Roles").First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	if len(user.Roles) == 0 {
		fmt.Printf("User %d has no roles assigned.\n", userID)
		return nil
	}

	fmt.Printf("Roles for user %d (%s):\n\n", userID, user.Email)
	for _, role := range user.Roles {
		fmt.Printf("- %s: %s\n", role.Name, role.Description)
	}

	return nil
}

func grantUserPermission(userID uint64, permissionStr string, allow bool) error {
	// Parse permission
	resource, action, err := parsePermission(permissionStr)
	if err != nil {
		return err
	}

	// Find permission
	var permission models.Permission
	if err := db.MySQL.Where("resource = ? AND action = ?", resource, action).First(&permission).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("permission '%s' not found", permissionStr)
		}
		return fmt.Errorf("failed to get permission: %w", err)
	}

	// Check if user exists
	var user models.User
	if err := db.MySQL.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Create or update user permission
	userPerm := models.UserPermission{
		UserID:       uint(userID),
		PermissionID: permission.ID,
		Allow:        allow,
	}

	if err := db.MySQL.Save(&userPerm).Error; err != nil {
		return fmt.Errorf("failed to grant permission: %w", err)
	}

	status := "granted"
	if !allow {
		status = "denied"
	}
	fmt.Printf("✅ Permission '%s' %s for user %d\n", permissionStr, status, userID)
	return nil
}

func revokeUserPermission(userID uint64, permissionStr string) error {
	// Parse permission
	resource, action, err := parsePermission(permissionStr)
	if err != nil {
		return err
	}

	// Find permission
	var permission models.Permission
	if err := db.MySQL.Where("resource = ? AND action = ?", resource, action).First(&permission).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("permission '%s' not found", permissionStr)
		}
		return fmt.Errorf("failed to get permission: %w", err)
	}

	result := db.MySQL.Where("user_id = ? AND permission_id = ?", userID, permission.ID).Delete(&models.UserPermission{})
	if result.Error != nil {
		return fmt.Errorf("failed to revoke permission: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return fmt.Errorf("user does not have direct permission '%s'", permissionStr)
	}

	fmt.Printf("✅ Permission '%s' revoked from user %d\n", permissionStr, userID)
	return nil
}

func listUserPermissions(userID uint64) error {
	var user models.User
	if err := db.MySQL.Preload("Roles.Permissions").Preload("Permissions.Permission").First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	fmt.Printf("Permissions for user %d (%s):\n\n", userID, user.Email)

	// Show role-based permissions
	if len(user.Roles) > 0 {
		fmt.Println("From Roles:")
		for _, role := range user.Roles {
			if len(role.Permissions) > 0 {
				fmt.Printf("  %s:\n", role.Name)
				for _, perm := range role.Permissions {
					fmt.Printf("    ✅ %s:%s\n", perm.Resource, perm.Action)
				}
			}
		}
		fmt.Println()
	}

	// Show direct permissions
	if len(user.Permissions) > 0 {
		fmt.Println("Direct Permissions:")
		for _, userPerm := range user.Permissions {
			status := "✅"
			if !userPerm.Allow {
				status = "❌"
			}
			fmt.Printf("  %s %s:%s\n", status, userPerm.Permission.Resource, userPerm.Permission.Action)
		}
	} else if len(user.Roles) == 0 {
		fmt.Println("No permissions assigned.")
	}

	return nil
}

func resetUserPassword(userID uint64) error {
	// Check if user exists
	var user models.User
	if err := db.MySQL.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	// Get new password interactively
	password, err := promptPassword("New password: ")
	if err != nil {
		return fmt.Errorf("failed to read password: %w", err)
	}

	confirmPassword, err := promptPassword("Confirm password: ")
	if err != nil {
		return fmt.Errorf("failed to read password confirmation: %w", err)
	}

	if password != confirmPassword {
		return fmt.Errorf("passwords do not match")
	}

	// Validate password
	if err := validatePassword(password); err != nil {
		return err
	}

	// Hash password
	hashedPassword, err := hashPassword(password)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Update password and reset login attempts
	updates := map[string]interface{}{
		"password_hash":  hashedPassword,
		"login_attempts": 0,
		"locked_until":   nil,
	}

	if err := db.MySQL.Model(&user).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	fmt.Printf("✅ Password reset successfully for user %d (%s)\n", userID, user.Email)
	return nil
}

func unlockUser(userID uint64) error {
	var user models.User
	if err := db.MySQL.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("user not found")
		}
		return fmt.Errorf("failed to get user: %w", err)
	}

	updates := map[string]interface{}{
		"login_attempts": 0,
		"locked_until":   nil,
	}

	if err := db.MySQL.Model(&user).Updates(updates).Error; err != nil {
		return fmt.Errorf("failed to unlock user: %w", err)
	}

	fmt.Printf("✅ User unlocked successfully (ID: %d, Email: %s)\n", userID, user.Email)
	return nil
}

func listAllRoles() error {
	var roles []models.Role
	if err := db.MySQL.Find(&roles).Error; err != nil {
		return fmt.Errorf("failed to list roles: %w", err)
	}

	if len(roles) == 0 {
		fmt.Println("No roles found.")
		return nil
	}

	fmt.Printf("Available roles:\n\n")
	for _, role := range roles {
		status := "✅"
		if !role.IsActive {
			status = "❌"
		}
		fmt.Printf("%s %s: %s\n", status, role.Name, role.Description)
	}

	return nil
}

func listAllPermissions() error {
	var permissions []models.Permission
	if err := db.MySQL.Find(&permissions).Error; err != nil {
		return fmt.Errorf("failed to list permissions: %w", err)
	}

	if len(permissions) == 0 {
		fmt.Println("No permissions found.")
		return nil
	}

	fmt.Printf("Available permissions:\n\n")
	resourceMap := make(map[string][]models.Permission)
	for _, perm := range permissions {
		resourceMap[perm.Resource] = append(resourceMap[perm.Resource], perm)
	}

	for resource, perms := range resourceMap {
		fmt.Printf("%s:\n", resource)
		for _, perm := range perms {
			fmt.Printf("  - %s:%s (%s)\n", perm.Resource, perm.Action, perm.Description)
		}
		fmt.Println()
	}

	return nil
}
