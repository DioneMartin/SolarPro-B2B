import { TextInput, PasswordInput, Button, Paper, Title, Text, Stack, Container, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../../../shared/auth/AuthContext';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const form = useForm({ initialValues: { email: '', password: '' } });

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      const data = await authApi.login(values);
      login(data.accessToken, data.user);
      navigate('/');
    } catch {
      form.setErrors({ email: 'Invalid email or password' });
    }
  });

  return (
    <Container size={420} my={80}>
      <Title ta="center" mb="md">SolarPro</Title>
      <Text c="dimmed" size="sm" ta="center" mb="xl">Sign in to your account</Text>
      <Paper withBorder p="xl" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="Email" placeholder="you@company.com" {...form.getInputProps('email')} required />
            <PasswordInput label="Password" placeholder="Your password" {...form.getInputProps('password')} required />
            <Button type="submit" fullWidth mt="sm">Sign in</Button>
          </Stack>
        </form>
        <Text size="sm" ta="center" mt="md">
          No account? <Anchor component={Link} to="/signup">Sign up</Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
