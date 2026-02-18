import { View, Text, ScrollView } from 'react-native';
import { ClipboardList } from 'lucide-react-native';

export default function OrdersScreen() {
    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="bg-brand-background">
            <View className="flex-1 justify-center items-center px-6">
                <View className="bg-slate-100 p-8 rounded-full mb-6">
                    <ClipboardList size={48} color="#64748b" />
                </View>
                <Text className="text-brand-primary text-xl font-bold mb-2">Sem pedidos ainda</Text>
                <Text className="text-brand-secondary text-center">
                    Quando você contratar um serviço, ele aparecerá aqui para acompanhamento.
                </Text>
            </View>
        </ScrollView>
    );
}
