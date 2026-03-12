import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius } from '../../utils/theme';

type PasswordInputProps = Omit<TextInputProps, 'secureTextEntry'> & {
    containerStyle?: any;
};

export default function PasswordInput({ containerStyle, style, ...props }: PasswordInputProps) {
    const [visible, setVisible] = useState(false);

    return (
        <View style={[styles.container, containerStyle]} aria-label="Senha">
            <TextInput
                {...props}
                secureTextEntry={!visible}
                style={[styles.input, style]}
            />
            <TouchableOpacity
                onPress={() => setVisible(!visible)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.toggle}
            >
                <Ionicons
                    name={visible ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={Colors.textTertiary}
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 60,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        paddingHorizontal: 20,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
        height: '100%',
    },
    toggle: {
        marginLeft: 8,
    },
});
