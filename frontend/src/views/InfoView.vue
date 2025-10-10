<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-sm q-mb-md">
      <div class="col"><div class="text-h5">Información</div></div>
      <div class="col-auto" v-if="isAdmin && !editing"><q-btn flat dense icon="edit" label="Editar" @click="startEdit" /></div>
      <div class="col-auto" v-if="isAdmin && editing">
        <q-btn flat dense label="Cancelar" @click="cancelEdit" />
      </div>
    </div>

    <div v-if="!editing">
      <div v-if="infoText" class="q-mb-md pre-line">{{ infoText }}</div>
      <q-banner v-else class="bg-grey-2 text-grey-8">Sin contenido aún</q-banner>
    </div>

    <div v-else>
      <q-input v-model="draft" type="textarea" autogrow outlined label="Contenido de información" />
      <q-btn class="q-mt-sm" color="primary" unelevated rounded :loading="saving" label="Guardar" @click="save" />
      <q-banner v-if="error" class="bg-red-2 text-red-10 q-mt-sm" dense>{{ error }}</q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';

const settings = useSettingsStore();
const auth = useAuthStore();
const isAdmin = computed(() => Boolean(auth.user && auth.user.role === 'admin'));

const infoText = computed(() => settings.infoText || '');
const editing = ref(false);
const draft = ref('');
const saving = ref(false);
const error = ref('');

onMounted(() => { void settings.load(); });

function startEdit() {
  draft.value = infoText.value;
  editing.value = true;
}
function cancelEdit() {
  editing.value = false;
  draft.value = '';
  error.value = '';
}
async function save() {
  saving.value = true;
  error.value = '';
  try {
    await settings.update({ infoText: draft.value });
    settings.infoText = draft.value;
    editing.value = false;
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'No se pudo guardar la información';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.pre-line { white-space: pre-line; }
</style>
