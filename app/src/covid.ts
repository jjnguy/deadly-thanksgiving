import covidInfections from "./covid_infections.json";
import covidPop from "./covid_populations.json";
import { nCr, nWiseArray } from "./my_math";
import type { AddressType, HouseholdType } from "./types";


let statePopCache: Map<string, number> = new Map<string, number>();

let stateList: string[] = null;
function listStates(): string[] {
  if (!stateList) {
    stateList = Array.from(new Set(covidPop.map(item => item.state)));
  }

  return stateList;
}

function listCounties(state: string) {
  return covidPop.filter(it => it.state == state && it.county != "Statewide Unallocated").map(it => it.county);
}

function getPop(addr: AddressType): number {
  if (!addr.state && addr.county) throw 'must supply state with county';

  if (!addr.state) return covidPop.reduce((acum, next) => acum + next.pop, 0);

  if (addr.county) {
    let cty = covidPop.filter(item => item.state == addr.state && item.county == addr.county)[0];
    if (cty) return cty.pop;
    return getPop({ state: addr.state });
  }

  if (!statePopCache[addr.state]) {
    let result = covidPop
      .filter(pop => pop.state == addr.state)
      .reduce((acum, next) => acum + next.pop, 0);

    statePopCache[addr.state] = result;
  }

  return statePopCache[addr.state];
}

let stateInfectionCache: Map<string, number> = new Map<string, number>();
let overallInfectionAverage: number = null;
function getInfectionCount(addr: AddressType): number {
  if (!addr.state && addr.county) throw 'must supply state with county';

  if (!addr.state && !addr.county) {
    if (!overallInfectionAverage) {
      overallInfectionAverage = covidInfections.reduce((acum, next) => acum + next.avgInfected, 0) / covidInfections.length;
    }
    return overallInfectionAverage;
  }

  if (addr.county) {
    let cty = covidInfections.filter(item => item.state == addr.state && item.county == addr.county)[0];
    if (cty) return cty.avgInfected;
    return getInfectionCount({ state: addr.state });
  }

  if (!stateInfectionCache[addr.state]) {
    let stateEntries = covidInfections
      .filter(item => item.state == addr.state);
    let result = stateEntries
      .reduce((acum, next) => acum + next.avgInfected, 0) / stateEntries.length;

    stateInfectionCache[addr.state] = result;
  }

  return stateInfectionCache[addr.state];
}

function getInfectionRate(addr: AddressType) {
  return getInfectionCount(addr) / getPop(addr);
}

function chanceForIndividualToBeInfectedInPast(numDays: number, addr: AddressType) {
  return getInfectionRate(addr) * numDays;
}

function chanceForHouseholdToBeInfectedInPast(numDays: number, household: HouseholdType) {
  let probOne = chanceForIndividualToBeInfectedInPast(numDays, household.address);
  let combinations = 0;
  for (let i = 1; i <= household.size; i++) {
    let sign = i % 2 == 0 ? -1 : 1;
    combinations += sign * (nCr(household.size, i) * Math.pow(probOne, i));
  }
  return combinations;
}

function chanceForHouseholdsToBeInfectedInPast(numDays: number, households: HouseholdType[]) {
  let probs = households.flatMap(h => new Array<number>(h.size).fill(chanceForIndividualToBeInfectedInPast(numDays, h.address)));

  let combinations = 0;
  for (let i = 1; i <= probs.length; i++) {
    let sign = i % 2 == 0 ? -1 : 1;
    combinations += sign * (nWiseArray(i, probs).reduce((acum, next) => acum + next.reduce((acum2, next2) => acum2 * next2, 1), 0));
  }
  return combinations;
}


export { listStates, listCounties, getPop, getInfectionCount, getInfectionRate, chanceForIndividualToBeInfectedInPast, chanceForHouseholdToBeInfectedInPast, chanceForHouseholdsToBeInfectedInPast }