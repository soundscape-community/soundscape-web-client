<template>
    <SubpageTopbar title="Help" />
    
    <div class="container">
        <div class="row">
            <div class="col">
                <div class="grey-box">
                    <button title="Track callouts">
                        <i class="fas">&#xf124;</i>
                    </button>
                    <strong>Track callouts</strong>
                    - Announce nearby locations as you move around.
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="col">
                <div class="grey-box">
                    <button id="btn_near_me" title="Announce places near me">ⓘ</button>
                    <strong>Announce places near me</strong>
                    - Announce nearby locations and how far away they are.
                </div>
            </div>
        </div>
    
        <div class="row">
            <div class="col">
                <div class="grey-box">
                    <button title="Voice">
                        <i class="fas">🗣</i>
                    </button>
                    <strong>Voice</strong>
                    - Select the voice that announces nearby locations.
                </div>
            </div>
        </div>
    
       
        <div class="col">
            <div class="grey-box">
                <InputSpinner
                  title="Speaking rate"
                  :min="1" :max="5" :initial="2"
                />
                <strong>Speaking rate </strong>- Adjust how fast the voice talks.
            </div>
        </div>
    </div>
</template>

<script setup>
import InputSpinner from '../components/InputSpinner.vue';
import SubpageTopbar from '../components/SubpageTopbar.vue';
</script>

<style>
.home-container {
    margin-right: auto; /* Push the home button to the left */
}

.title-container {
    flex-grow: 1; 
    text-align: center; /* Center-align the title */
}

nav h1 {
    /* text-align: center;  */
    color: white;
    margin: 0;
}


.grey-box {
    background-color: #e0e0e0; 
    padding: 20px; 
    margin: 10px;
    align-items: center; /* Align items vertically */
  }

  .grey-box button {
    background-color: #e74c3d; 
    color: white; 
    border: none; 
    padding: 10px; 
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
}

.home {
    font-size: 2.0em;
    padding: 5px 10px; 
    margin-right: auto;
    background-color: #e74c3d; 
    border: none; 
}

img {
    width: 25%;
    height: auto;
}

.help-link {
    text-decoration: none;
    color: inherit;
    cursor: pointer;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.row {
    margin-bottom: 20px;
}
</style>