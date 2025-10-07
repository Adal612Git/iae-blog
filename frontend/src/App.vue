<template>
  <q-layout view="hHh Lpr lFf" class="app-layout">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          class="lt-md"
          aria-label="Abrir menú"
          @click="toggleDrawer"
        />
        <q-toolbar-title>IAE Blog</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <AppSidebar v-model="drawerOpen" />

    <q-page-container class="app-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppSidebar from './components/AppSidebar.vue';

const $q = useQuasar();
const drawerOpen = ref($q.screen.gt.sm);

watch(
  () => $q.screen.gt.sm,
  (isLarge) => {
    drawerOpen.value = isLarge;
  }
);

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: var(--q-color-grey-1);
}

.app-page-container {
  min-height: 100vh;
  background: transparent;
}
</style>
