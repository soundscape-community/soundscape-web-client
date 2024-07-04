<template>
  <button class="nav-button"
    id="btn_callouts" title="btn_callouts">
      <i class='fas'>&#xf124;</i>
  </button>
  <button
    class="nav-button"
    id="btn_near_me"
    title="Announce places near me"
  >
      ⓘ
  </button>
  <select
    class="nav-button"
    id="voice"
    name="voice"
    title="Voice"
    required
  ></select>

  <SpeechRate />

  <button class="nav-button">
    <a href="./help.html" title="FAQ page">
      <i class="fas fa-question" style="color: white;"></i>
    </a>
  </button>
</template>

<script>
import SpeechRate from './components/SpeechRate.vue';

export default {
  name: 'App',
  components: {
    SpeechRate
  },
};
</script>

