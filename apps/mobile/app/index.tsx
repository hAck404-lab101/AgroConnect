import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadAuth();
      setLoading(false);
      
      if (user) {
        const role = user.role.toLowerCase();
        router.replace(`/(tabs)/marketplace`);
      } else {
        router.replace('/(auth)/login');
      }
    };
    
    init();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={styles.text}>Loading...</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
  },
  text: {
    marginTop: 16,
    color: '#666',
  },
});
