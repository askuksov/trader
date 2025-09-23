package helpers

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"testing"
	"time"

	"trader/internal/config"
	"trader/internal/models"

	"github.com/go-testfixtures/testfixtures/v3"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// TestDB holds test database connection and fixtures
type TestDB struct {
	DB       *gorm.DB
	fixtures *testfixtures.Loader
}

// SetupTestDB creates an in-memory SQLite database for testing
func SetupTestDB(t testing.TB) *TestDB {
	// Create test database file with unique name
	testDBPath := fmt.Sprintf("file:test_%d.db?mode=memory&cache=shared", time.Now().UnixNano())
	db, err := gorm.Open(sqlite.Open(testDBPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err)

	// Auto-migrate all models
	err = db.AutoMigrate(
		&models.User{},
		&models.Role{},
		&models.Permission{},
		&models.UserRole{},
		&models.UserPermission{},
		&models.PasswordResetToken{},
		&models.AuditLog{},
		&models.Exchange{},
		&models.Coin{},
		&models.TradingPair{},
	)
	require.NoError(t, err)

	// Create test database and setup fixtures
	sqlDB := getDB(db)
	testDB := &TestDB{
		DB: db,
	}

	// Setup fixtures if fixture directory exists
	fixturePath := filepath.Join("..", "fixtures")
	if _, err := os.Stat(fixturePath); err == nil {
		fixtures, err := testfixtures.New(
			testfixtures.Database(sqlDB),
			testfixtures.Dialect("sqlite"),
			testfixtures.Directory(fixturePath),
			testfixtures.DangerousSkipTestDatabaseCheck(),
		)
		if err == nil {
			testDB.fixtures = fixtures
		}
	}

	return testDB
}

// TeardownTestDB cleans up test database
func (tdb *TestDB) TeardownTestDB(t testing.TB) {
	sqlDB, err := tdb.DB.DB()
	require.NoError(t, err)
	sqlDB.Close()
}

// LoadFixtures loads test fixtures into database
func (tdb *TestDB) LoadFixtures(t testing.TB) {
	if tdb.fixtures != nil {
		err := tdb.fixtures.Load()
		require.NoError(t, err)
	}
}

// ClearTables removes all data from tables
func (tdb *TestDB) ClearTables(t testing.TB) {
	tables := []string{
		"user_permissions", "user_roles", "password_reset_tokens", "audit_logs",
		"users", "roles", "permissions", "exchanges", "coins", "trading_pairs",
	}

	for _, table := range tables {
		err := tdb.DB.Exec(fmt.Sprintf("DELETE FROM %s", table)).Error
		require.NoError(t, err)
	}
}

// CreateTestUser creates a test user with optional roles
func (tdb *TestDB) CreateTestUser(t testing.TB, email, firstName, lastName string, roles ...string) *models.User {
	return tdb.CreateTestUserWithPassword(t, email, firstName, lastName, "password123", roles...)
}

// CreateTestUserWithPassword creates a test user with specified password and optional roles
func (tdb *TestDB) CreateTestUserWithPassword(t testing.TB, email, firstName, lastName, password string, roles ...string) *models.User {
	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	require.NoError(t, err)

	user := &models.User{
		Email:        email,
		FirstName:    firstName,
		LastName:     lastName,
		PasswordHash: string(hashedPassword),
		IsActive:     true,
	}

	err = tdb.DB.Create(user).Error
	require.NoError(t, err)

	// Assign roles if provided
	for _, roleName := range roles {
		var role models.Role
		err := tdb.DB.Where("name = ?", roleName).First(&role).Error
		if err == nil {
			err = tdb.DB.Model(user).Association("Roles").Append(&role)
			require.NoError(t, err)
		}
	}

	return user
}

// CreateTestRole creates a test role with permissions
func (tdb *TestDB) CreateTestRole(t testing.TB, name, description string, permissions ...string) *models.Role {
	role := &models.Role{
		Name:        name,
		Description: description,
		IsActive:    true,
	}

	err := tdb.DB.Create(role).Error
	require.NoError(t, err)

	// Assign permissions if provided
	for _, permName := range permissions {
		var perm models.Permission
		err := tdb.DB.Where("name = ?", permName).First(&perm).Error
		if err == nil {
			err = tdb.DB.Model(role).Association("Permissions").Append(&perm)
			require.NoError(t, err)
		}
	}

	return role
}

// CreateTestPermission creates a test permission
func (tdb *TestDB) CreateTestPermission(t testing.TB, resource, action, description string) *models.Permission {
	perm := &models.Permission{
		Resource:    resource,
		Action:      action,
		Description: description,
	}

	err := tdb.DB.Create(perm).Error
	require.NoError(t, err)

	return perm
}

// AssignUserPermission assigns direct permission to user
func (tdb *TestDB) AssignUserPermission(t testing.TB, userID, permissionID uint, allow bool) {
	userPerm := &models.UserPermission{
		UserID:       userID,
		PermissionID: permissionID,
		Allow:        allow,
	}

	err := tdb.DB.Create(userPerm).Error
	require.NoError(t, err)
}

// getDB extracts the underlying database connection for testfixtures
func getDB(db *gorm.DB) *sql.DB {
	sqlDB, _ := db.DB()
	return sqlDB
}

// GetTestConfig returns configuration for testing
func GetTestConfig() *config.Config {
	return &config.Config{
		JWT: config.JWTConfig{
			AccessSecret:    "test-access-secret-key-for-testing-only",
			RefreshSecret:   "test-refresh-secret-key-for-testing-only",
			AccessDuration:  15 * time.Minute,   // 15 minutes
			RefreshDuration: 7 * 24 * time.Hour, // 7 days
			Issuer:          "trader-test",
		},
		Security: config.SecurityConfig{
			MaxLoginAttempts: 5,
			LockoutDuration:  30 * time.Minute, // 30 minutes
		},
	}
}

// SetupTestEnvironment sets up environment variables for testing
func SetupTestEnvironment() {
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("LOG_LEVEL", "error")
}
