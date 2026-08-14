export interface NavItem {
  title: string;
  href: string;
  iconName: 'Home' | 'Globe' | 'Users' | 'Activity' | 'Settings' | 'CheckSquare';
  badge?: string;
  exact?: boolean;
}

export const siteConfig = {
  name: 'PARALLEL',
  fullName: 'Parallel AI World',
  tagline: 'Your worlds. Your people. Your intelligence.',
  description: 'Create persistent worlds and populate them with intelligent people, roles, and tasks.',
  mainNav: [
    {
      title: 'Home',
      href: '/',
      iconName: 'Home',
      exact: true,
    },
    {
      title: 'My Worlds',
      href: '/worlds',
      iconName: 'Globe',
    },
    {
      title: 'People',
      href: '/people',
      iconName: 'Users',
    },
    {
      title: 'Activity',
      href: '/activity',
      iconName: 'Activity',
    },
    {
      title: 'Settings',
      href: '/settings',
      iconName: 'Settings',
    },
  ] as NavItem[],
  mobileNav: [
    {
      title: 'Home',
      href: '/',
      iconName: 'Home',
      exact: true,
    },
    {
      title: 'Worlds',
      href: '/worlds',
      iconName: 'Globe',
    },
    {
      title: 'People',
      href: '/people',
      iconName: 'Users',
    },
    {
      title: 'Activity',
      href: '/activity',
      iconName: 'Activity',
    },
    {
      title: 'Settings',
      href: '/settings',
      iconName: 'Settings',
    },
  ] as NavItem[],
};
