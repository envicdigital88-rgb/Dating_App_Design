import fs from 'fs';
import path from 'path';

const routes = {
  'join': 'Auth',
  'signin': 'Auth',
  'onboarding': 'Onboarding',
  '(app)/discover': 'Discover',
  '(app)/likes': 'Likes',
  '(app)/requests': 'Requests',
  '(app)/connections': 'Connections',
  '(app)/messages': 'Messages',
  '(app)/messages/[conversationId]': 'Chat',
  '(app)/photos': 'Photos',
  '(app)/notifications': 'Notifications',
  '(app)/profile': 'MyProfile',
  '(app)/profile/[userId]': 'ProfileDetail',
  '(app)/packages': 'Packages',
  '(app)/checkout/[packageId]': 'Checkout',
  '(app)/subscription': 'SubscriptionPage',
  '(app)/settings': 'Settings',
  '(admin)': 'admin/AdminOverview',
  '(admin)/users': 'admin/AdminUsers',
  '(admin)/moderation': 'admin/AdminModeration',
  '(admin)/activity': 'admin/AdminActivity',
  '(admin)/packages': 'admin/AdminPackages',
  '(admin)/payments': 'admin/AdminPayments'
};

for (const [routePath, componentPath] of Object.entries(routes)) {
  const dir = path.join('src', 'app', routePath);
  fs.mkdirSync(dir, { recursive: true });
  
  let importPath = path.relative(dir, path.join('src', 'views', componentPath)).replace(/\\/g, '/');
  if (!importPath.startsWith('.')) {
    importPath = './' + importPath;
  }
  
  let componentName = componentPath.split('/').pop();
  
  // Need "use client" in the wrapper or just let the view have it. The view already has it from the migration script.
  let content = `
import { ${componentName} } from '${importPath}';

export default function Page() {
  return <${componentName} />;
}
`;

  // Provide Auth mode if necessary
  if (routePath === 'join') {
    content = `
import { Auth } from '${importPath}';

export default function Page() {
  return <Auth mode="register" />;
}
`;
  } else if (routePath === 'signin') {
    content = `
import { Auth } from '${importPath}';

export default function Page() {
  return <Auth mode="signin" />;
}
`;
  }

  fs.writeFileSync(path.join(dir, 'page.tsx'), content.trim() + '\n');
}
