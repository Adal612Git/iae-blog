<template>
  <q-page class="q-pa-md flex flex-center">
    <q-card style="width: 360px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6">Login</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="onSubmit" class="q-gutter-md">
          <q-input v-model="email" type="email" label="Email" required />
          <q-input v-model="password" type="password" label="Password" required />
          <q-btn type="submit" color="primary" :loading="loading" label="Login" />
          <q-banner v-if="error" class="bg-red-2 text-red-10" dense>{{ error }}</q-banner>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const auth = useAuthStore();
const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    await auth.login(email.value, password.value);
    if (auth.token) await router.push('/dashboard');
    else error.value = auth.error || 'No se pudo iniciar sesión';
  } catch (e: unknown) {
    error.value = auth.error || (e instanceof Error ? e.message : 'Error al iniciar sesión');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped></style>
