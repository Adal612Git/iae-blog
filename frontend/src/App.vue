<template>
  <q-layout view="hHh Lpr lFf" class="app-layout" :style="layoutStyle">
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
        <q-toolbar-title>
          <div class="row items-center q-col-gutter-sm">
            <div class="col-auto" v-if="logoSrc">
              <img :src="logoSrc" alt="Logo" class="app-logo" />
            </div>
            <div class="col">IAE Blog</div>
          </div>
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <AppSidebar v-model="drawerOpen" />

    <q-page-container class="app-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import AppSidebar from './components/AppSidebar.vue';
import { useSettingsStore } from './stores/settingsStore';
import { computeMediaUrl } from './utils/media';
import { useAuthStore } from './stores/authStore';

const $q = useQuasar();
const drawerOpen = ref($q.screen.gt.sm);
const settings = useSettingsStore();
const auth = useAuthStore();

watch(
  () => $q.screen.gt.sm,
  (isLarge) => {
    drawerOpen.value = isLarge;
  }
);

function toggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

onMounted(() => { void settings.load(); });

const logoSrc = computed(() => settings.logoUrl ? computeMediaUrl(settings.logoUrl) : '');
const layoutStyle = computed(() => {
  const url = settings.backgroundUrl ? computeMediaUrl(settings.backgroundUrl) : '';
  return url ? { backgroundImage: `url('${url}')`, backgroundSize: 'cover', backgroundPosition: 'center top' } : {};
});

// Asegurar que el drawer se abra tras login en pantallas grandes
watch(
  () => auth.token,
  (t) => {
    if (t && $q.screen.gt.sm) {
      drawerOpen.value = true;
    }
  }
);
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  background: #ffffff;
}

.app-page-container {
  min-height: 100vh;
  background: transparent;
}

.app-logo {
  height: 28px;
  width: auto;
  display: block;
}
</style>
