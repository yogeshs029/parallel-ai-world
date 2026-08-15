export interface NavItem {
  title: string;
  href: string;
  iconName:
    | 'Home'
    | 'Globe'
    | 'Users'
    | 'Target'
    | 'CheckSquare'
    | 'MessageSquare'
    | 'Activity'
    | 'Calendar'
    | 'BookOpen'
    | 'Brain'
    | 'Settings';
  badge?: string;
  exact?: boolean;
}

export const siteConfig = {
  name: 'PARALLEL',
  fullName: 'Parallel AI World',
  tagline: 'Build worlds. Empower people.',
  description: 'Create persistent spaces populated with intelligent AI people who think, collaborate, and get things done.',
  mainNav: [
    { title: 'Home', href: '/', iconName: 'Home', exact: true },
    { title: 'My Worlds', href: '/worlds', iconName: 'Globe' },
    { title: 'People', href: '/people', iconName: 'Users' },
    { title: 'Goals & Plans', href: '/goals', iconName: 'Target' },
    { title: 'Tasks', href: '/tasks', iconName: 'CheckSquare' },
    { title: 'Communications', href: '/conversations', iconName: 'MessageSquare' },
    { title: 'Activity', href: '/activity', iconName: 'Activity' },
    { title: 'Calendar', href: '/calendar', iconName: 'Calendar' },
    { title: 'Knowledge', href: '/knowledge', iconName: 'BookOpen' },
    { title: 'Memories', href: '/memories', iconName: 'Brain' },
    { title: 'Settings', href: '/settings', iconName: 'Settings' },
  ] as NavItem[],
  mobileNav: [
    { title: 'Home', href: '/', iconName: 'Home', exact: true },
    { title: 'Worlds', href: '/worlds', iconName: 'Globe' },
    { title: 'People', href: '/people', iconName: 'Users' },
    { title: 'Goals', href: '/goals', iconName: 'Target' },
    { title: 'More', href: '/conversations', iconName: 'MessageSquare' },
  ] as NavItem[],
};
