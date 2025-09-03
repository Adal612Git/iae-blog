<template>
  <q-header elevated>
    <q-toolbar>
      <q-toolbar-title>IAE Blog</q-toolbar-title>
      <q-btn flat dense no-caps to="/" label="Home" />
      <q-btn flat dense no-caps to="/info" label="Info" />
      <q-btn v-if="!isAuth" flat dense no-caps to="/login" label="Login" />
      <q-btn v-else flat dense no-caps to="/dashboard" label="Dashboard" />
      <q-space />
      <q-btn v-if="isAuth" flat dense no-caps label="Logout" @click="onLogout" />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../stores/authStore';
import { useRouter } from 'vue-router';

const auth = useAuthStore();
const router = useRouter();
const isAuth = computed(() => Boolean(auth.token));

async function onLogout() {
  auth.logout();
  await router.push('/login');
}
</script>

<style scoped></style>
