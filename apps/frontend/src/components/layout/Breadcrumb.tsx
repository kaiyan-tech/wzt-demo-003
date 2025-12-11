import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { menuConfig } from '@/config/menu.config';
import type { MenuItem } from '@/config/menu.types';

function isPathMatch(itemPath: string | undefined, currentPath: string) {
  if (!itemPath) return false;
  if (itemPath === '/') return currentPath === '/';
  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}

export function Breadcrumb() {
  const location = useLocation();

  const items = useMemo(() => {
    const findPath = (list: MenuItem[], parents: MenuItem[] = []): MenuItem[] | null => {
      for (const item of list) {
        const next = [...parents, item];
        if (isPathMatch(item.path, location.pathname)) {
          return next;
        }
        if (item.children) {
          const result = findPath(item.children, next);
          if (result) return result;
        }
      }
      return null;
    };

    return findPath(menuConfig) ?? [];
  }, [location.pathname]);

  return (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground">
      <Link to="/" className="flex items-center gap-1 hover:text-foreground">
        <Home className="h-4 w-4" />
        <span className="hidden sm:inline">首页</span>
      </Link>
      {items.map((item, index) => (
        <div key={item.key} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-slate-400" />
          {index === items.length - 1 || !item.path ? (
            <span className="font-medium text-foreground">{item.label}</span>
          ) : (
            <Link to={item.path} className="hover:text-foreground">
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
