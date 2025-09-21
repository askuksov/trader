# Subtask: Console Commands and User Management

**ID**: TASK-BACKEND-001.3  
**Parent**: TASK-BACKEND-001  
**Status**: planned  
**Priority**: High  
**Dependencies**: TASK-BACKEND-001.2

## Overview

Implement console commands for database migrations and user management with interactive password input for security.

## Scope

### Console Commands
- Enhanced migration command with seeding
- User management command with interactive password prompts
- Role and permission management commands
- Data initialization and seeding

### Security Features
- Interactive password prompts (hidden input)
- Email validation
- Role validation
- Permission validation

## Acceptance Criteria

- [ ] Migration command runs up/down migrations
- [ ] Migration command supports data seeding
- [ ] User creation with interactive password prompt
- [ ] User listing with filtering options
- [ ] User role assignment and removal
- [ ] User permission management
- [ ] Password reset with interactive prompt
- [ ] Data validation in all commands
- [ ] Error handling and user feedback

## Commands Implementation

### Migration Command
```bash
# Run migrations
./migrate up

# Rollback migrations  
./migrate down [--steps=1]

# Reset database (down all + up all)
./migrate reset

# Seed initial data (roles, permissions)
./migrate seed

# Show migration status
./migrate status
```

### User Management Command
```bash
# Create user (password prompted interactively)
./user create --email=user@example.com --first-name=John --last-name=Doe [--role=trader]
# Password: (interactive prompt, hidden input)
# Confirm password: (interactive prompt, hidden input)

# List users
./user list [--role=trader] [--active=true] [--limit=10] [--offset=0]

# Show user details
./user show --email=user@example.com
./user show --id=uuid

# Update user
./user update --id=uuid [--email=newemail@example.com] [--first-name=Jane] [--active=false]

# Activate/deactivate user
./user activate --id=uuid
./user deactivate --id=uuid

# Delete user (soft delete)
./user delete --id=uuid
```

### Role Management Commands
```bash
# Assign role to user
./user set-role --id=uuid --role=admin

# Remove role from user  
./user remove-role --id=uuid --role=admin

# List user roles
./user roles --id=uuid

# List all roles
./user list-roles
```

### Permission Management Commands
```bash
# Grant direct permission to user
./user grant-permission --id=uuid --permission=positions:create --allow=true

# Deny permission to user
./user grant-permission --id=uuid --permission=positions:create --allow=false

# Remove direct permission
./user revoke-permission --id=uuid --permission=positions:create

# List user permissions (effective permissions)
./user permissions --id=uuid

# List all available permissions
./user list-permissions
```

### Password Management Commands
```bash
# Reset user password (interactive prompt)
./user reset-password --id=uuid
# New password: (interactive prompt, hidden input)
# Confirm password: (interactive prompt, hidden input)

# Force password change on next login
./user force-password-change --id=uuid

# Unlock user account
./user unlock --id=uuid
```

## Implementation Details

### Interactive Password Input
```go
func promptPassword(prompt string) (string, error) {
    fmt.Print(prompt)
    password, err := term.ReadPassword(int(syscall.Stdin))
    if err != nil {
        return "", err
    }
    fmt.Println() // Print newline after hidden input
    return string(password), nil
}

func createUserCommand() {
    // Get password interactively
    password, err := promptPassword("Password: ")
    if err != nil {
        log.Fatal("Failed to read password:", err)
    }
    
    confirmPassword, err := promptPassword("Confirm password: ")
    if err != nil {
        log.Fatal("Failed to read password confirmation:", err)
    }
    
    if password != confirmPassword {
        log.Fatal("Passwords do not match")
    }
    
    // Validate password strength
    if err := validatePassword(password); err != nil {
        log.Fatal("Password validation failed:", err)
    }
}
```

### Command Structure
```go
// cmd/migrate/main.go
func main() {
    rootCmd := &cobra.Command{
        Use:   "migrate",
        Short: "Database migration tool",
    }
    
    rootCmd.AddCommand(upCmd, downCmd, resetCmd, seedCmd, statusCmd)
    rootCmd.Execute()
}

// cmd/user/main.go  
func main() {
    rootCmd := &cobra.Command{
        Use:   "user",
        Short: "User management tool",
    }
    
    rootCmd.AddCommand(
        createCmd, listCmd, showCmd, updateCmd,
        activateCmd, deactivateCmd, deleteCmd,
        setRoleCmd, removeRoleCmd, rolesCmd,
        grantPermissionCmd, revokePermissionCmd, permissionsCmd,
        resetPasswordCmd, unlockCmd,
    )
    rootCmd.Execute()
}
```

### Validation
```go
type UserValidator struct{}

func (v *UserValidator) ValidateEmail(email string) error {
    if !isValidEmail(email) {
        return errors.New("invalid email format")
    }
    return nil
}

func (v *UserValidator) ValidatePassword(password string) error {
    if len(password) < 8 {
        return errors.New("password must be at least 8 characters")
    }
    // Add more validation rules
    return nil
}

func (v *UserValidator) ValidateRole(role string) error {
    validRoles := []string{"super_admin", "admin", "trader", "viewer"}
    for _, validRole := range validRoles {
        if role == validRole {
            return nil
        }
    }
    return errors.New("invalid role")
}
```

### Data Seeding
```go
func seedInitialData(db *gorm.DB) error {
    // Seed roles
    roles := []models.Role{
        {Name: "super_admin", Description: "Full system access"},
        {Name: "admin", Description: "User and system management"},
        {Name: "trader", Description: "Trading operations and own data"},
        {Name: "viewer", Description: "Read-only access to own data"},
    }
    
    for _, role := range roles {
        if err := db.FirstOrCreate(&role, "name = ?", role.Name).Error; err != nil {
            return err
        }
    }
    
    // Seed permissions
    permissions := []models.Permission{
        {Resource: "users", Action: "create", Description: "Create users"},
        {Resource: "users", Action: "read", Description: "Read all users"},
        {Resource: "users", Action: "update", Description: "Update users"},
        {Resource: "users", Action: "delete", Description: "Delete users"},
        {Resource: "api_keys", Action: "create", Description: "Create API keys"},
        {Resource: "api_keys", Action: "read_own", Description: "Read own API keys"},
        // ... more permissions
    }
    
    for _, permission := range permissions {
        if err := db.FirstOrCreate(&permission, 
            "resource = ? AND action = ?", 
            permission.Resource, permission.Action).Error; err != nil {
            return err
        }
    }
    
    return nil
}
```

## Error Handling

### User-Friendly Messages
```go
var (
    ErrUserNotFound     = errors.New("user not found")
    ErrEmailExists      = errors.New("user with this email already exists")
    ErrInvalidRole      = errors.New("invalid role specified")
    ErrInvalidPermission = errors.New("invalid permission specified")
    ErrWeakPassword     = errors.New("password does not meet requirements")
)

func handleError(err error) {
    switch {
    case errors.Is(err, ErrUserNotFound):
        log.Error("User not found. Please check the user ID or email.")
    case errors.Is(err, ErrEmailExists):
        log.Error("A user with this email already exists.")
    default:
        log.Error("An unexpected error occurred:", err)
    }
    os.Exit(1)
}
```

## Testing Requirements

- [ ] Command parsing and validation tests
- [ ] Interactive password input tests (mocked)
- [ ] User creation with validation tests
- [ ] Role assignment tests
- [ ] Permission management tests
- [ ] Data seeding tests
- [ ] Error handling tests
