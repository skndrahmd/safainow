import { Tabs } from 'expo-router'
import UrduText from '@/components/UrduText'

function TabLabel({ label }: { label: string }) {
  return (
    <UrduText style={{ fontSize: 11 }}>
      {label}
    </UrduText>
  )
}

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="(jobs)"
        options={{ tabBarLabel: () => <TabLabel label="کام" /> }}
      />
      <Tabs.Screen
        name="history"
        options={{ tabBarLabel: () => <TabLabel label="تاریخ" /> }}
      />
      <Tabs.Screen
        name="earnings"
        options={{ tabBarLabel: () => <TabLabel label="کمائی" /> }}
      />
    </Tabs>
  )
}
