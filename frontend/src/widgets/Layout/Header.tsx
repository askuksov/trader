import { Menu, User } from 'lucide-react'
import { Button } from '@/shared/ui/button'
import { useTheme } from '@/app/providers/ThemeProvider'
import { Breadcrumb } from './Breadcrumb'

interface HeaderProps {
  onMobileMenuClick: () => void
}

export function Header({ onMobileMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={onMobileMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open navigation</span>
      </Button>

      {/* Breadcrumb */}
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex items-center">
          <Breadcrumb />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </Button>

        {/* User menu */}
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground"
        >
          <User className="h-5 w-5" />
          <span className="sr-only">User menu</span>
        </Button>
      </div>
    </header>
  )
}
