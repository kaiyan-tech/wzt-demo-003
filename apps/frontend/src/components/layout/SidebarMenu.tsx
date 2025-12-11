import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Dot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFilteredMenu } from '@/hooks/useFilteredMenu';
import type { MenuItem } from '@/config/menu.types';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu as UISidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';

export function SidebarMenu() {
  const menu = useFilteredMenu();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <SidebarGroup>
      <SidebarGroupLabel>导航</SidebarGroupLabel>
      <SidebarGroupContent>
        <UISidebarMenu>
          {menu.map((item) => (
            <MenuNode key={item.key} item={item} currentPath={currentPath} depth={0} />
          ))}
        </UISidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function MenuNode({
  item,
  currentPath,
  depth,
}: {
  item: MenuItem;
  currentPath: string;
  depth: number;
}) {
  const hasChildren = Boolean(item.children && item.children.length > 0);

  const childActive = useMemo(
    () => (item.children ? item.children.some((child) => hasActive(child, currentPath)) : false),
    [item.children, currentPath],
  );
  const isActive = isPathActive(item.path, currentPath) || childActive;
  const [open, setOpen] = useState(
    hasChildren && (childActive || isPathActive(item.path, currentPath)),
  );

  const Icon = item.icon ?? (depth > 0 ? Dot : undefined);

  useEffect(() => {
    if (hasChildren) {
      setOpen(childActive || isPathActive(item.path, currentPath));
    }
  }, [childActive, currentPath, hasChildren, item.path]);

  const content = (
    <>
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span className="truncate">{item.label}</span>
      {hasChildren && (
        <ChevronRight className={cn('ml-auto h-4 w-4 transition-transform', open && 'rotate-90')} />
      )}
    </>
  );

  if (depth > 0) {
    return (
      <SidebarMenuSubItem>
        <SidebarMenuSubButton
          asChild
          isActive={isActive}
          aria-expanded={hasChildren ? open : undefined}
          onClick={!item.path && hasChildren ? () => setOpen((prev) => !prev) : undefined}
        >
          {item.path ? (
            <Link to={item.path}>{content}</Link>
          ) : (
            <button type="button" className="flex w-full items-center gap-2">
              {content}
            </button>
          )}
        </SidebarMenuSubButton>
        {hasChildren && open && (
          <SidebarMenuSub>
            {item.children!.map((child) => (
              <MenuNode key={child.key} item={child} currentPath={currentPath} depth={depth + 1} />
            ))}
          </SidebarMenuSub>
        )}
      </SidebarMenuSubItem>
    );
  }

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        aria-expanded={hasChildren ? open : undefined}
        onClick={!item.path && hasChildren ? () => setOpen((prev) => !prev) : undefined}
      >
        {item.path ? (
          <Link to={item.path}>{content}</Link>
        ) : (
          <button type="button" className="flex w-full items-center gap-2">
            {content}
          </button>
        )}
      </SidebarMenuButton>

      {hasChildren && open && (
        <SidebarMenuSub>
          {item.children!.map((child) => (
            <MenuNode key={child.key} item={child} currentPath={currentPath} depth={depth + 1} />
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

function isPathActive(path: string | undefined, currentPath: string) {
  if (!path) return false;
  return currentPath === path || currentPath.startsWith(`${path}/`);
}

function hasActive(item: MenuItem, currentPath: string): boolean {
  if (isPathActive(item.path, currentPath)) return true;
  if (!item.children) return false;
  return item.children.some((child) => hasActive(child, currentPath));
}
