import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0d9488',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { borderTopColor: '#e5e7eb' },
        headerStyle: { backgroundColor: '#0d9488' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Partidos',
          tabBarIcon: ({ color, size }) => <Ionicons name="tennisball-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tournaments/index"
        options={{
          title: 'Torneos',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="matches/new"
        options={{
          title: 'Crear partido',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="matches/[id]" options={{ href: null }} />
      <Tabs.Screen name="tournaments/[id]" options={{ href: null }} />
    </Tabs>
  );
}
