import { Redirect } from 'expo-router';

export default function Home() {
    return (
        <Redirect href="/(tabs)" aria-label="Boas Vindas" />
    );
}
