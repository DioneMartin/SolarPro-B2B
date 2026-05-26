import { TextInput, PasswordInput, Button, Paper, Title, Stack, Container, Text, Anchor } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api';
import { useAuth } from '../../../shared/auth/AuthContext';

export function SignupPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const form = useForm({
    initialValues: { tenantName: '', slug: '', adminEmail: '', adminDisplayName: '', adminPassword: '' },
    validate: {
      slug: (v) => /^[a-z0-9-]{2,}$/.test(v) ? null : 'Lowercase letters, digits and hyphens only (min 2 chars)',
      adminPassword: (v) => v.length >= 12 ? null : 'Minimum 12 characters',
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      const data = await authApi.signup(values);
      login(data.accessToken, data.user);
      navigate('/');
    } catch (e: any) {
      form.setErrors({ tenantName: e?.response?.data?.message ?? 'Signup failed' });
    }
  });

  return (
    <Container size={480} my={80}>
      <Title ta="center" mb="md">Create your company account</Title>
      <Paper withBorder p="xl" radius="md">
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="Company name" placeholder="Acme Solar" {...form.getInputProps('tenantName')} required />
            <TextInput label="Slug (URL identifier)" placeholder="acme-solar" {...form.getInputProps('slug')} required />
            <TextInput label="Admin email" placeholder="admin@acme.com" {...form.getInputProps('adminEmail')} required />
            <TextInput label="Admin display name" placeholder="Jane Doe" {...form.getInputProps('adminDisplayName')} required />
            <PasswordInput label="Admin password" placeholder="Min 12 characters" {...form.getInputProps('adminPassword')} required />
            <Button type="submit" fullWidth mt="sm">Create account</Button>
          </Stack>
        </form>
        <Text size="sm" ta="center" mt="md">
          Already have an account? <Anchor component={Link} to="/login">Sign in</Anchor>
        </Text>
      </Paper>
    </Container>
  );
}
