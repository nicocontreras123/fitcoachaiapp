import { Image, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  style?: any;
}

const SIZES = {
  small: 40,
  medium: 80,
  large: 120,
  xlarge: 200,
};

export function Logo({ size = 'medium', style }: LogoProps) {
  const { isDark } = useTheme();
  const logoSize = SIZES[size];

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/fitcoach_logo.png')}
        style={[
          styles.logo,
          {
            width: logoSize,
            height: logoSize,
            opacity: isDark ? 0.95 : 1,
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    aspectRatio: 1,
  },
});
