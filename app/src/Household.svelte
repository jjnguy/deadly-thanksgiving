<script lang="ts">
  import { getInfectionCount } from "./covid";

  import type { PersonType } from "./types";

  export let states: string[];
  export let name: string;
  export let people: PersonType[];

  let state = "";

  let under18 = people.filter((person) => person.age < 18).length;
  let middle = people.filter(
    (person) => person.age == null || (person.age >= 18 && person.age <= 70)
  ).length;
  let over70 = people.filter((person) => person.age > 70).length;

  function adjustPeople() {
    people = [
      ...Object.keys(new Array(under18)).map((_) => 12),
      ...Object.keys(new Array(middle)).map((_) => 33),
      ...Object.keys(new Array(under18)).map((_) => 75),
    ].map((age) => ({ name: "unknown", age: age }));
  }
</script>

<li>
  <div>{name}</div>
  <label>state
    <select bind:value={state}>
      {#each states as state}
        <option>{state}</option>
      {/each}
    </select></label><span>Infections in the last 7 days ({getInfectionCount(state)})</span>
  <h3>People</h3>
  <ul>
    <li>
      Under 18
      <input type="number" bind:value={under18} on:change={adjustPeople} />
    </li>
    <li>
      18 to 70
      <input type="number" bind:value={middle} on:change={adjustPeople} />
    </li>
    <li>
      Over 70
      <input type="number" bind:value={over70} on:change={adjustPeople} />
    </li>
  </ul>
</li>
