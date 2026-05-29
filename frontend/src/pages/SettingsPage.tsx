import { Stack, Title, Text, TextInput, Button, Group, PasswordInput, Paper } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../shared/auth/AuthContext';

export function SettingsPage() {
  const { user } = useAuth();

  const profileForm = useForm({
    initialValues: {
      name: user?.fullName ?? '',
      email: user?.email ?? '',
    },
  });

  const passwordForm = useForm({
    initialValues: { currentPassword: '', newPassword: '', confirm: '' },
    validate: {
      confirm: (v, vals) => v !== vals.newPassword ? 'Passwords do not match' : null,
      newPassword: (v) => v.length < 12 ? 'At least 12 characters' : null,
    },
  });

  // Profile update would call a PATCH /auth/me endpoint (not yet wired)
  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    mutationFn: (v: typeof profileForm.values) => {
      // POST /auth/me — placeholder; backend endpoint TBD
      return Promise.resolve(v);
    },
  });

  return (
    <Stack maw={520}>
      <Title order={2}>Settings</Title>

      <Paper withBorder p="md">
        <Stack>
          <Title order={4}>Profile</Title>
          <Text size="sm" c="dimmed">Role: <strong>{user?.role}</strong></Text>

          <form onSubmit={profileForm.onSubmit((v) => saveProfile(v))}>
            <Stack>
              <TextInput label="Name" {...profileForm.getInputProps('name')} />
              <TextInput label="Email" type="email" {...profileForm.getInputProps('email')} />
              <Group justify="flex-end">
                <Button type="submit" loading={savingProfile}>Save Profile</Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>

      <Paper withBorder p="md">
        <Stack>
          <Title order={4}>Change Password</Title>
          <form onSubmit={passwordForm.onSubmit(() => {
            // PATCH /auth/me/password — placeholder
            passwordForm.reset();
          })}>
            <Stack>
              <PasswordInput label="Current password" required {...passwordForm.getInputProps('currentPassword')} />
              <PasswordInput label="New password" required {...passwordForm.getInputProps('newPassword')} />
              <PasswordInput label="Confirm new password" required {...passwordForm.getInputProps('confirm')} />
              <Group justify="flex-end">
                <Button type="submit">Update Password</Button>
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Stack>
  );
}
