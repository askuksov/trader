#!/bin/bash
# Setup validation script for Trading Bot development environment

echo "🔍 Trading Bot DevOps Setup Validation"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

success_count=0
total_checks=0

check_requirement() {
    local name="$1"
    local command="$2"
    local version_flag="$3"
    
    ((total_checks++))
    
    if command -v "$command" &> /dev/null; then
        if [ -n "$version_flag" ]; then
            version=$($command $version_flag 2>/dev/null | head -n1)
            echo -e "✅ ${GREEN}$name${NC}: $version"
        else
            echo -e "✅ ${GREEN}$name${NC}: installed"
        fi
        ((success_count++))
    else
        echo -e "❌ ${RED}$name${NC}: not found"
        echo -e "   ${YELLOW}Please install $name${NC}"
    fi
}

check_docker_compose() {
    ((total_checks++))
    
    if docker compose version &> /dev/null; then
        version=$(docker compose version 2>/dev/null | head -n1)
        echo -e "✅ ${GREEN}Docker Compose (v2)${NC}: $version"
        ((success_count++))
    elif docker-compose --version &> /dev/null; then
        version=$(docker-compose --version 2>/dev/null | head -n1)
        echo -e "⚠️ ${YELLOW}Docker Compose (v1)${NC}: $version"
        echo -e "   ${YELLOW}Recommend upgrading to Docker Compose v2${NC}"
        ((success_count++))
    else
        echo -e "❌ ${RED}Docker Compose${NC}: not found"
        echo -e "   ${YELLOW}Please install Docker Compose${NC}"
    fi
}

check_file() {
    local name="$1"
    local path="$2"
    
    ((total_checks++))
    
    if [ -f "$path" ]; then
        echo -e "✅ ${GREEN}$name${NC}: found"
        ((success_count++))
    else
        echo -e "❌ ${RED}$name${NC}: missing ($path)"
    fi
}

check_directory() {
    local name="$1"
    local path="$2"
    
    ((total_checks++))
    
    if [ -d "$path" ]; then
        echo -e "✅ ${GREEN}$name${NC}: found"
        ((success_count++))
    else
        echo -e "❌ ${RED}$name${NC}: missing ($path)"
    fi
}

echo "🔧 Checking Host Prerequisites..."
echo "--------------------------------"
check_requirement "Docker" "docker" "--version"
check_docker_compose
check_requirement "Make" "make" "--version"
check_requirement "curl" "curl" "--version"

# Optional tools that can be useful for development
echo ""
echo "🛠️ Checking Optional Development Tools..."
echo "---------------------------------------"
((total_checks++))
if command -v tree &> /dev/null; then
    echo -e "✅ ${GREEN}Tree${NC}: installed (useful for directory structure)"
    ((success_count++))
else
    echo -e "ℹ️ ${YELLOW}Tree${NC}: not installed (optional - helps with directory visualization)"
    ((success_count++))
fi

((total_checks++))
if command -v jq &> /dev/null; then
    echo -e "✅ ${GREEN}jq${NC}: installed (useful for JSON parsing)"
    ((success_count++))
else
    echo -e "ℹ️ ${YELLOW}jq${NC}: not installed (optional - helps with JSON debugging)"
    ((success_count++))
fi

((total_checks++))
if command -v git &> /dev/null; then
    version=$(git --version 2>/dev/null | head -n1)
    echo -e "✅ ${GREEN}Git${NC}: $version"
    ((success_count++))
else
    echo -e "⚠️ ${YELLOW}Git${NC}: not found (recommended for version control)"
    ((success_count++))
fi

echo ""
echo "📁 Checking Project Structure..."
echo "-------------------------------"
check_directory "Backend" "backend"
check_directory "Frontend" "frontend"
check_directory "ML Service" "ml-service"
check_directory "Deployments" "deployments"
check_directory "Monitoring" "monitoring"
check_directory "Scripts" "scripts"
check_directory "Documentation" "docs"

echo ""
echo "⚙️ Checking Configuration Files..."
echo "--------------------------------"
check_file "Docker Compose Dev" "deployments/docker-compose.dev.yml"
check_file "Docker Compose Prod" "deployments/docker-compose.prod.yml"
check_file "Environment Template" "deployments/.env.example"
check_file "Environment Base" "deployments/.env"
check_file "Makefile" "Makefile"
check_file "Database Init" "scripts/init-db.sql"
check_file "Prometheus Config" "monitoring/prometheus/prometheus.yml"
check_file "Grafana Datasource" "monitoring/grafana/provisioning/datasources/prometheus.yml"

# Check for optional .env.local
((total_checks++))
if [ -f "deployments/.env.local" ]; then
    echo -e "✅ ${GREEN}Environment Local Override${NC}: .env.local found"
    ((success_count++))
else
    echo -e "ℹ️ ${YELLOW}Environment Local Override${NC}: .env.local not found (optional)"
    echo -e "   ${YELLOW}Create .env.local to override .env values for local development${NC}"
    ((success_count++))
fi

echo ""
echo "🐳 Checking Dockerfiles..."
echo "-------------------------"
check_file "Backend Dockerfile" "backend/Dockerfile"
check_file "Frontend Dockerfile" "frontend/Dockerfile"
check_file "ML Service Dockerfile" "ml-service/Dockerfile"

echo ""
echo "📜 Checking Scripts..."
echo "--------------------"
check_file "Health Check Script" "scripts/health-check.sh"
check_file "Wait For It Script" "scripts/wait-for-it.sh"
check_file "Backup Script" "scripts/backup.sh"
check_file "Restore Script" "scripts/restore.sh"
check_file "Validation Script" "scripts/validate-setup.sh"

# Check if scripts are executable
echo ""
echo "🔐 Checking Script Permissions..."
echo "--------------------------------"
for script in "health-check.sh" "wait-for-it.sh" "backup.sh" "restore.sh" "validate-setup.sh"; do
    ((total_checks++))
    if [ -x "scripts/$script" ]; then
        echo -e "✅ ${GREEN}$script${NC}: executable"
        ((success_count++))
    else
        echo -e "❌ ${RED}$script${NC}: not executable"
        echo -e "   ${YELLOW}Run: chmod +x scripts/$script${NC}"
    fi
done

# Check for new documentation structure
echo ""
echo "📚 Checking Documentation Structure..."
echo "-----------------------------------"
check_directory "Product Requirements" "docs/01_Product_Requirements"
check_directory "Technical Design" "docs/02_Technical_Design"
check_directory "DevOps MVP" "docs/03_DevOps_MVP"
check_directory "Golang MVP" "docs/04_Golang_MVP"
check_directory "Development Milestones" "docs/05_Development_Milestones"

check_file "Product Requirements" "docs/01_Product_Requirements/requirements.md"
check_file "Technical Design" "docs/02_Technical_Design/technical_design.md"
check_file "DevOps Requirements" "docs/03_DevOps_MVP/requirements.md"
check_file "DevOps Setup Complete" "docs/03_DevOps_MVP/setup_complete.md"
check_file "Golang Requirements" "docs/04_Golang_MVP/requirements.md"
check_file "Development Milestones" "docs/05_Development_Milestones/milestones.md"
check_file "Main README" "README.md"

# Check Docker daemon
echo ""
echo "🐳 Checking Docker Daemon..."
echo "---------------------------"
((total_checks++))
if docker info &> /dev/null; then
    echo -e "✅ ${GREEN}Docker Daemon${NC}: running"
    ((success_count++))
else
    echo -e "❌ ${RED}Docker Daemon${NC}: not running"
    echo -e "   ${YELLOW}Please start Docker Desktop or Docker daemon${NC}"
fi

# Check available disk space
echo ""
echo "💾 Checking System Resources..."
echo "------------------------------"
((total_checks++))
available_space=$(df -h . | awk 'NR==2 {print $4}' | sed 's/[^0-9.]//g')
if [ -n "$available_space" ] && [ "$(echo "$available_space > 2" | bc 2>/dev/null || echo "1")" -eq 1 ]; then
    echo -e "✅ ${GREEN}Disk Space${NC}: sufficient (${available_space}GB+ available)"
    ((success_count++))
else
    echo -e "⚠️ ${YELLOW}Disk Space${NC}: low (ensure at least 2GB free for Docker images)"
    ((success_count++))
fi

echo ""
echo "📊 Validation Results"
echo "===================="
echo -e "Passed: ${GREEN}$success_count${NC}/$total_checks checks"

if [ $success_count -eq $total_checks ]; then
    echo -e ""
    echo -e "🎉 ${GREEN}All checks passed!${NC}"
    echo -e ""
    echo -e "🚀 ${GREEN}Ready to start development environment:${NC}"
    echo -e "   ${YELLOW}make up${NC}"
    echo -e ""
    echo -e "📖 ${GREEN}Quick start guide:${NC}"
    echo -e "   1. Review configuration: ${YELLOW}vim deployments/.env${NC}"
    echo -e "   2. Override locally: ${YELLOW}vim deployments/.env.local${NC} (optional)"
    echo -e "   3. Start services: ${YELLOW}make up${NC}"
    echo -e "   4. Check health: ${YELLOW}make health${NC}"
    echo -e "   5. View dashboard: ${YELLOW}http://localhost:3000${NC}"
    echo -e "   6. Database admin: ${YELLOW}http://localhost:8081${NC}"
    echo -e "   7. Email testing: ${YELLOW}http://localhost:8025${NC}"
    echo -e ""
    echo -e "🔧 ${GREEN}Configuration System:${NC}"
    echo -e "   • Base config: ${YELLOW}.env${NC} (required)"
    echo -e "   • Local overrides: ${YELLOW}.env.local${NC} (optional)"
    echo -e "   • Docker Compose: ${YELLOW}docker compose${NC} (v2)"
    echo -e ""
    echo -e "💻 ${GREEN}Container-based Development:${NC}"
    echo -e "   • All language runtimes are in containers"
    echo -e "   • No need to install Go, Node.js, Python on host"
    echo -e "   • Use 'make shell-backend' for Go development"
    echo -e "   • Hot reload configured for both backend/frontend"
    echo -e ""
    echo -e "📝 ${GREEN}Note about Goose migrations:${NC}"
    echo -e "   • Database migrations will be handled by Goose tool"
    echo -e "   • Backend developer will implement migration commands"
    echo -e "   • Initial schema loads via init-db.sql for now"
    echo -e ""
    exit 0
else
    failed=$((total_checks - success_count))
    echo -e ""
    echo -e "⚠️ ${YELLOW}$failed checks failed.${NC}"
    echo -e ""
    echo -e "🔧 ${YELLOW}Please fix the issues above before proceeding.${NC}"
    echo -e ""
    exit 1
fi
