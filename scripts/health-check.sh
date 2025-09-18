#!/bin/bash
# Health check script for various services

check_http_service() {
    local url=$1
    local service_name=$2
    local timeout=${3:-10}
    
    if curl -f -s --max-time "$timeout" "$url" > /dev/null 2>&1; then
        echo "✓ $service_name is healthy"
        return 0
    else
        echo "✗ $service_name is not responding"
        return 1
    fi
}

check_mysql() {
    local host=${1:-localhost}
    local port=${2:-3306}
    local user=${3:-root}
    local password=$4
    
    if mysqladmin ping -h "$host" -P "$port" -u "$user" -p"$password" --silent 2>/dev/null; then
        echo "✓ MySQL is healthy"
        return 0
    else
        echo "✗ MySQL is not responding"
        return 1
    fi
}

check_redis() {
    local host=${1:-localhost}
    local port=${2:-6379}
    local password=$3
    
    if [ -n "$password" ]; then
        redis_cmd="redis-cli -h $host -p $port -a $password ping"
    else
        redis_cmd="redis-cli -h $host -p $port ping"
    fi
    
    if $redis_cmd > /dev/null 2>&1; then
        echo "✓ Redis is healthy"
        return 0
    else
        echo "✗ Redis is not responding"
        return 1
    fi
}

load_env_vars() {
    # Load environment variables from .env and .env.local (if exists)
    if [ -f "deployments/.env" ]; then
        export $(grep -v '^#' deployments/.env | xargs)
    fi
    
    if [ -f "deployments/.env.local" ]; then
        export $(grep -v '^#' deployments/.env.local | xargs)
    fi
}

# Main health check
main() {
    echo "=== Trading Bot Health Check ==="
    echo "Checking all services..."
    echo
    
    # Load environment variables
    load_env_vars
    
    failed=0
    
    # Check backend API
    check_http_service "http://localhost:8080/api/v1/health" "Backend API" || ((failed++))
    
    # Check frontend
    check_http_service "http://localhost:3000" "Frontend" || ((failed++))
    
    # Check ML service
    check_http_service "http://localhost:5000/health" "ML Service" || ((failed++))
    
    # Check Adminer
    check_http_service "http://localhost:8081" "Adminer (Database UI)" || ((failed++))
    
    # Check Mailpit
    check_http_service "http://localhost:8025" "Mailpit (Email Testing)" || ((failed++))
    
    # Check Prometheus
    check_http_service "http://localhost:9090/-/healthy" "Prometheus" || ((failed++))
    
    # Check Grafana
    check_http_service "http://localhost:3001/api/health" "Grafana" || ((failed++))
    
    # Check MySQL
    check_mysql "localhost" "3306" "root" "${MYSQL_ROOT_PASSWORD:-rootpassword}" || ((failed++))
    
    # Check Redis
    check_redis "localhost" "6379" "${REDIS_PASSWORD:-redispassword}" || ((failed++))
    
    echo
    if [ $failed -eq 0 ]; then
        echo "🎉 All services are healthy!"
        echo ""
        echo "🔗 Quick Links:"
        echo "  • Frontend Dashboard: http://localhost:3000"
        echo "  • Backend API: http://localhost:8080/api/v1/health" 
        echo "  • Database Admin: http://localhost:8081"
        echo "  • Email Testing: http://localhost:8025"
        echo "  • Monitoring: http://localhost:3001"
        echo ""
        echo "💡 Useful Commands:"
        echo "  • Check status: make status"
        echo "  • View logs: make logs"
        echo "  • Open Adminer: make open-adminer"
        echo "  • Open Mailpit: make open-mailpit"
        exit 0
    else
        echo "❌ $failed service(s) failed health check"
        echo ""
        echo "💡 Troubleshooting:"
        echo "  • Check logs: make logs"
        echo "  • Restart services: make restart"
        echo "  • Check container status: make status"
        echo "  • Check .env configuration: vim deployments/.env"
        echo "  • Check .env.local overrides: vim deployments/.env.local"
        exit 1
    fi
}

main "$@"
