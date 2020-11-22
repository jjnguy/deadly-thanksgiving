<script lang="ts">
  import HouseholdBuilder from "./HouseholdBuilder.svelte";
  import { chanceForHouseholdsToBeInfectedInPast } from "./covid";
  import type { HouseholdType } from "./types";

  let households: HouseholdType[] = [
    {
      size: 1,
      address: {},
      name: "Your House",
    },
  ];

  function addHousehold() {
    households = [
      ...households,
      {
        size: 1,
        address: {},
      },
    ];
  }
</script>

<style>
  main {
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    background-color: white;
  }

  .feature {
    font-size: 1.2rem;
  }
  h1 {
    text-align: center;
  }
  svg {
    margin-left: auto;
    margin-right: auto;
    display: block;
  }
</style>

<main>
  <h1>Deadly Thanksgiving</h1>
  <svg
    id="Capa_1"
    enable-background="new 0 0 510.014 510.014"
    height="100"
    viewBox="0 0 510.014 510.014"
    width="100"
    xmlns="http://www.w3.org/2000/svg"><g>
      <path d="m206 414.999h-30v65.01h-25v30h80v-30h-25z" fill="#824520" />
      <path d="m334 480.009v-65.01h-30v65.01h-25v30h80v-30z" fill="#673416" />
      <path
        d="m318 63.009v83.15c-60.68 0-52.092.02-126 .02v-83.17c0-55.766 67.986-84.137 107.55-44.54 11.89 11.88 18.45 27.7 18.45 44.54z"
        fill="#c00" />
      <path
        d="m318 63.009v83.15c-19.74 0-6.817-.002-63 .01v-146.16c34.792 0 63 28.151 63 63z"
        fill="#b80000" />
      <path
        d="m446.096 216.009h-83.216v30c1.079 0-16.632 15.482-16.497 16.553l28.617 64.447v15h72c16.84 0 32.662-6.556 44.541-18.447 39.729-39.685 11.133-107.553-45.445-107.553z"
        fill="#b80000" />
      <path
        d="m446.29 83.735c-24.612-24.626-64.477-24.635-89.096-.003l-58.98 58.98-21.108 75.169 60.461 21.238-5.283 5.283 21.213 21.213 92.784-92.784c24.62-24.592 24.639-64.494.009-89.096z"
        fill="#9a000a" />
      <path
        d="m147.12 216.009h-84.12c-34.738 0-63 28.262-63 63 0 34.807 28.158 63 63 63h72v-15l47.979-64.957-35.859-16.043z"
        fill="#c00" />
      <path
        d="m172.092 239.119 63.823-16.813-24.47-79.594-58.977-58.977c-11.897-11.903-27.718-18.459-44.549-18.459-56.409 0-83.822 68.315-44.547 107.549l92.79 92.79c36.585-36.586 12.911-12.912 21.213-21.213z"
        fill="#b80000" />
      <path
        d="m325.95 322.049c0 67.69-70.95 123.96-70.95 123.96-112.329 0-173.566-112.675-108.24-190.13 0 0 17.224 4.93 21.155 1.322 3.464-3.18.825-21.782.825-21.782 14.12-10.36 30.83-18.3 49.51-22.95l3.62 14.56h66.26l3.62-14.56c54.357 13.53 34.2 52.586 34.2 109.58z"
        fill="#9f5528" />
      <path
        d="m390 327.009c0 67.68-62.34 119-135 119v-218.98h33.13l3.62-14.56c18.07 4.5 34.96 12.39 49.47 22.99 0 0 .943 20.907 4.312 23.954 4.078 3.688 17.728-3.554 17.728-3.554 16.6 19.51 26.74 43.92 26.74 71.15z"
        fill="#904d24" />
      <path
        d="m323.35 191.009c-3.68 12.21-34.74 21.35-46.24 38.79l.85 6.12-22.96 38.98-31.34-47.49c-11.51-17.43-33.33-24.19-37.01-36.4-12.047-40.089 19.987-87 68.35-87 46.779 0 80.842 45.429 68.35 87z"
        fill="#904d24" />
      <path
        d="m323.35 191.009c-3.68 12.21-34.74 21.35-46.24 38.79l.85 6.12-22.96 38.98v-170.89c46.779 0 80.842 45.429 68.35 87z"
        fill="#824520" />
      <path
        d="m290.48 197.459c-4.49 14.88-5.75 11.84-13.37 22.72l-17.28 59.22-4.83 4.82-10.61-10.6c-19.62-19.62-49.854-56.081-57.74-82.61h68.35c37.269 6.777 32.04 5.827 35.48 6.45z"
        fill="#ff9e00" />
      <path
        d="m323.35 191.009c-8.193 26.919-38.127 62.999-57.74 82.61-6.937 6.937-4.529 4.531-10.61 10.6v-93.21z"
        fill="#ff9000" />
      <path
        d="m363.26 255.859c-49.694 49.68-22.046 22.036-108.23 108.22-.1.1 4.049 4.109-108.27-108.2 6.36-7.53 13.72-14.41 21.98-20.46l86.26 86.27c.609-.608 57.638-57.648 86.22-86.23 8.18 5.97 15.6 12.82 22.04 20.4z"
        fill="#904d24" />
      <path
        d="m363.26 255.859c-49.694 49.68-22.046 22.036-108.23 108.22v-42.42c33.39-33.395 66.448-66.458 86.19-86.2 8.18 5.97 15.6 12.82 22.04 20.4z"
        fill="#824520" />
    </g>
  </svg>
  <p>
    This tool simulates the chance of a Thanksgiving guest being COVID-19
    positive. Build your guest list below.
  </p>
  <p>This tool is for 'fun' only. The math is rough.</p>
  <p class="feature">
    Chance of any guests being infected within the last 14 days:
    {(chanceForHouseholdsToBeInfectedInPast(14, households) * 100).toFixed(3)}%
  </p>
  <h2>Household{households.length == 1 ? '' : 's'}</h2>
  <div>
    <p>
      Build your Thanksgiving party below. Choose a state and county each
      houshold is located in. And select the number of people in that household.
      Add as many households as would be joining your Thanksgiving celebration.
    </p>
  </div>
  <ul>
    {#each households as household}
      <li>
        <HouseholdBuilder bind:household />
      </li>
    {/each}
  </ul>
  <button on:click={addHousehold}>add household</button>
</main>
<div>
  Icons made by
  <a
    href="https://www.flaticon.com/authors/freepik"
    target="_blank"
    title="Freepik">Freepik</a>
  from
  <a
    href="https://www.flaticon.com/"
    target="_blank"
    title="Flaticon">www.flaticon.com</a>
</div>
<div>
  PRs welcome -
  <a
    href="https://github.com/jjnguy/deadly-thanksgiving"
    target="_blank">github.com/jjnguy/deadly-thanksgiving</a>
</div>
