<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col"><div class="text-h5">Gestión de usuarios</div></div>
      <div class="col-auto"><q-btn flat icon="arrow_back" label="Volver" @click="goBack" /></div>
    </div>

    <q-card class="q-mb-lg" bordered>
      <q-card-section>
        <div class="text-subtitle1">Crear usuario</div>
        <div class="text-caption text-grey-7">Crea una nueva cuenta (rol: admin por ahora)</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form @submit.prevent="onCreate" class="q-gutter-md" style="max-width: 520px">
          <q-input v-model="email" type="email" label="Email" outlined dense required autocomplete="email" />
          <q-input v-model="password" type="password" label="Password (mínimo 6 caracteres)" outlined dense required autocomplete="new-password" />
          <q-input v-model="confirm" type="password" label="Confirmar password" outlined dense required autocomplete="new-password" />
          <div class="row q-col-gutter-sm">
            <div class="col-auto"><q-btn type="submit" color="primary" unelevated :loading="loading" label="Crear usuario" /></div>
            <div class="col-auto"><q-btn flat color="grey-8" label="Limpiar" @click="reset" /></div>
          </div>
          <q-banner v-if="success" class="bg-green-2 text-green-10" dense>{{ success }}</q-banner>
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
import { adminCreateUser } from '../services/api';

const router = useRouter();
const auth = useAuthStore();

const email = ref('');
const password = ref('');
const confirm = ref('');
const loading = ref(false);
const error = ref('');
const success = ref('');

function reset() {
  email.value = '';
  password.value = '';
  confirm.value = '';
  error.value = '';
  success.value = '';
}

function goBack() { void router.push('/dashboard'); }

async function onCreate() {
  error.value = '';
  success.value = '';
  if (password.value.length < 6) {
    error.value = 'El password debe tener al menos 6 caracteres';
    return;
  }
  if (password.value !== confirm.value) {
    error.value = 'Las contraseñas no coinciden';
    return;
  }
  loading.value = true;
  try {
    const res = await adminCreateUser(email.value, password.value, auth.token);
    if (res?.user?.id) {
      success.value = `Usuario creado: ${res.user.email}`;
      reset();
    } else {
      error.value = res?.message || 'No se pudo crear el usuario';
    }
  } catch (e: unknown) {
    if (typeof e === 'object' && e && 'response' in e) {
      const r = (e as { response?: { data?: { message?: unknown } } }).response;
      const m = r?.data?.message;
      error.value = typeof m === 'string' ? m : 'No se pudo crear el usuario';
    } else if (e instanceof Error) {
      error.value = e.message;
    } else {
      error.value = 'No se pudo crear el usuario';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped></style>

