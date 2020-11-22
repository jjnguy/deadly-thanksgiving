<script context="module">
  var count = 0;
</script>

<script lang="ts">
  import AddrPicker from "./AddrPicker.svelte";
  import type { HouseholdType } from "./types";

  export let household: HouseholdType;

  count++;
</script>

<h3>Household {count}</h3>
<AddrPicker bind:addr={household.address} />
<label>household size
  <input bind:value={household.size} type="number" min="1" max="15" />
</label>
