import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius } from '../utils/theme';
import { captureException } from '../utils/sentry';

type Props = { children: ReactNode };
type State = { hasError: boolean; errorMessage: string };

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, errorMessage: '' };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorMessage: error.message };
    }

    componentDidCatch(error: Error) {
        captureException(error);
    }

    handleRetry = () => {
        this.setState({ hasError: false, errorMessage: '' });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        return (
            <View style={styles.container}>
                <Ionicons name="alert-circle-outline" size={64} color={Colors.error} />
                <Text style={styles.title}>Algo deu errado</Text>
                <Text style={styles.message}>
                    Ocorreu um erro inesperado. Por favor, tente novamente.
                </Text>
                <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
                    <Text style={styles.buttonText}>Tentar novamente</Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    title: {
        ...Typography.h3,
        color: Colors.text,
        marginTop: Spacing.lg,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    message: {
        ...Typography.body,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    buttonText: {
        ...Typography.button,
        color: Colors.white,
    },
});
