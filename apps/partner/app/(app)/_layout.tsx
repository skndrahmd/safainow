import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function TabLabel({ label }: { label: string }) {
  return (
    <Text style={{ fontFamily: 'NotoNastaliqUrdu', fontSize: 11 }}>
      {label}
    </Text>
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
