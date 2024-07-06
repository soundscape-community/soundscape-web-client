<template>
    <nav>
      <button class="nav-button"
        id="btn_callouts" title="Start tracking">
          <i class='fas'>&#xf124;</i>
      </button>
      <button
        class="nav-button"
        id="btn_near_me"
        title="Announce places near me"
      >
          ⓘ
      </button>

      <VoiceSelector />
      <InputSpinner
        title="Speaking rate"
        :min="1" :max="5" :initial="audioQueue.rate"
        :incAction="audioQueue.increaseRate"
        :decAction="audioQueue.decreaseRate"
      />

      <button class="nav-button">
        <a href="./help.html" title="FAQ page">
          <i class="fas fa-question" style="color: white;"></i>
        </a>
      </button>
    </nav>

    <main>
      <Map />
      <CalloutList />
    </main>
</template>

<script setup>
import { inject } from 'vue';
import CalloutList from './CalloutList.vue';
import InputSpinner from './InputSpinner.vue';
import Map from './Map.vue';
import VoiceSelector from './VoiceSelector.vue';

const audioQueue = inject('audioQueue');
</script>

