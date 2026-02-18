import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { User, Settings, Shield, LogOut, ChevronRight } from 'lucide-react-native';

export default function ProfileScreen() {
    const menuItems = [
        { icon: <User size={20} color="#334155" />, label: 'Dados Pessoais' },
        { icon: <Shield size={20} color="#334155" />, label: 'Segurança' },
        { icon: <Settings size={20} color="#334155" />, label: 'Configurações' },
    ];

    return (
        <ScrollView className="flex-1 bg-brand-background">
            <View className="items-center py-10 bg-white border-b border-slate-100">
                <View className="w-24 h-24 bg-brand-accent/10 rounded-full items-center justify-center mb-4">
                    <User size={48} color="#2563eb" />
                </View>
                <Text className="text-brand-primary text-xl font-bold">Cliente Teste</Text>
                <Text className="text-brand-secondary">cliente@tgtdigital.com</Text>
            </View>

            <View className="mt-6 px-6">
                {menuItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        className="flex-row items-center justify-between bg-white p-4 rounded-xl mb-3 border border-slate-50 shadow-sm"
                    >
                        <View className="flex-row items-center">
                            {item.icon}
                            <Text className="ml-3 text-brand-secondary font-medium">{item.label}</Text>
                        </View>
                        <ChevronRight size={20} color="#94a3b8" />
                    </TouchableOpacity>
                ))}

                <TouchableOpacity
                    className="flex-row items-center bg-red-50 p-4 rounded-xl mt-6 border border-red-100"
                >
                    <LogOut size={20} color="#ef4444" />
                    <Text className="ml-3 text-red-500 font-bold">Sair da Conta</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}
