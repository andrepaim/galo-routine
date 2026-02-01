import { Redirect } from 'expo-router';
import { useAuthStore } from '../lib/stores';

export default function Index() {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (role === 'child') {
    return <Redirect href="/(child)" />;
  }

  return <Redirect href="/(parent)" />;
}
