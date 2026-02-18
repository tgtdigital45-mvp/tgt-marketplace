import { View, Text, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Search, MapPin, Bell } from 'lucide-react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export default function HomeScreen() {
    return (
        <ScrollView className="flex-1 bg-brand-background">
            {/* Header */}
            <View className="px-6 pt-12 pb-6 bg-brand-primary rounded-b-3xl">
                <View className="flex-row justify-between items-center mb-6">
                    <View className="flex-row items-center">
                        <MapPin size={20} color="#ffffff" />
                        <Text className="text-white ml-2 font-medium">São Paulo, SP</Text>
                    </View>
                    <Bell size={24} color="#ffffff" />
                </View>

                <Text className="text-white text-2xl font-bold mb-4">
                    O que você precisa hoje?
                </Text>

                <View className="flex-row items-center bg-white rounded-xl px-4 py-2">
                    <Search size={20} color="#94a3b8" />
                    <TextInput
                        placeholder="Buscar serviços..."
                        className="flex-1 ml-2 text-brand-primary"
                        placeholderTextColor="#94a3b8"
                    />
                </View>
            </View>

            {/* Categorias (Placeholder) */}
            <View className="px-6 mt-8">
                <Text className="text-brand-primary text-xl font-bold mb-4">Categorias</Text>
                <View className="flex-row flex-wrap justify-between">
                    {['Contratos', 'Consultoria', 'Design', 'Tech', 'Marketing', 'Jurídico'].map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            className="w-[30%] bg-white p-4 rounded-xl mb-4 items-center shadow-sm border border-slate-100"
                        >
                            <View className="w-10 h-10 bg-brand-accent/10 rounded-full items-center justify-center mb-2">
                                <Text className="text-brand-accent text-lg">📁</Text>
                            </View>
                            <Text className="text-brand-secondary text-xs font-medium">{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Destaques (Placeholder) */}
            <View className="px-6 mt-4 pb-20">
                <Text className="text-brand-primary text-xl font-bold mb-4">Em Destaque</Text>
                <View className="bg-brand-accent p-6 rounded-2xl">
                    <Text className="text-white text-lg font-bold">Oferta Especial</Text>
                    <Text className="text-white/80 mt-2">
                        Contrate sua consultoria jurídica com 20% de desconto hoje.
                    </Text>
                    <TouchableOpacity className="bg-white mt-4 py-2 px-6 rounded-lg self-start">
                        <Text className="text-brand-accent font-bold">Ver agora</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}
