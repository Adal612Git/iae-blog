<template>
  <q-drawer
    v-model="drawer"
    show-if-above
    side="left"
    bordered
    class="app-sidebar"
  >
    <div class="q-pa-md app-sidebar__header">
      <div class="text-h6">IAE Blog</div>
      <div class="text-caption text-grey-7">Explora las secciones</div>
    </div>

    <q-separator spaced />

    <q-list padding class="app-sidebar__list">
      <q-item
        clickable
        v-ripple
        to="/"
        exact
        active-class="app-sidebar__item--active"
        @click="closeOnMobile"
      >
        <q-item-section avatar><q-icon name="home" /></q-item-section>
        <q-item-section>Home</q-item-section>
      </q-item>

      <q-item
        clickable
        v-ripple
        to="/info"
        active-class="app-sidebar__item--active"
        @click="closeOnMobile"
      >
        <q-item-section avatar><q-icon name="info" /></q-item-section>
        <q-item-section>Info</q-item-section>
      </q-item>

      <!-- Login oculto al público: no se muestra enlace -->

      <q-item v-if="isAuth" clickable v-ripple to="/dashboard" active-class="app-sidebar__item--active" @click="closeOnMobile">
        <q-item-section avatar><q-icon name="dashboard" /></q-item-section>
        <q-item-section>Dashboard</q-item-section>
      </q-item>

      <q-item v-if="isAuth" clickable v-ripple to="/users" active-class="app-sidebar__item--active" @click="closeOnMobile">
        <q-item-section avatar><q-icon name="group_add" /></q-item-section>
        <q-item-section>Usuarios</q-item-section>
      </q-item>
    </q-list>

    <q-separator v-if="isAuth" spaced />

    <q-list v-if="isAuth" padding>
      <q-item clickable v-ripple @click="onLogout">
        <q-item-section avatar><q-icon name="logout" /></q-item-section>
        <q-item-section>Cerrar sesión</q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (event: 'update:modelValue', value: boolean): void }>();

const drawer = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const auth = useAuthStore();
const router = useRouter();
const $q = useQuasar();

const isAuth = computed(() => Boolean(auth.token));

function closeOnMobile() {
  if (!$q.screen.gt.sm) {
    emit('update:modelValue', false);
  }
}

async function onLogout() {
  auth.logout();
  emit('update:modelValue', false);
  await router.push('/login');
}
</script>

<style scoped>
.app-sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(6px);
  min-width: 240px;
  border-right: 1px solid var(--q-color-grey-4);
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.04);
}

.app-sidebar__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-sidebar__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-sidebar__item--active {
  background: rgba(33, 150, 243, 0.12);
  border-left: 3px solid var(--q-primary);
}

.app-sidebar :deep(.q-item) {
  border-radius: 8px;
  margin-bottom: 4px;
}

.app-sidebar :deep(.q-item__section--avatar) {
  color: var(--q-primary);
}

@media (max-width: 1023px) {
  .app-sidebar {
    min-width: 200px;
  }
}
</style>
