import { Redirect } from 'expo-router';

export default function Home() {
    return (
        <Redirect href="/(tabs)/browse" aria-label="Boas Vindas" />
    );
}
