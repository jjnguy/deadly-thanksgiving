import covidInfections from "./covid_infections.json";
import covidPop from "./covid_populations.json";
import type { AddressType } from "./types";


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

  if (addr.county)
    return covidPop.filter(item => item.state == addr.state && item.county == addr.county)[0].pop;

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

  if (addr.county)
    return covidInfections.filter(item => item.state == addr.state && item.county == addr.county)[0].avgInfected;

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

function chanceToBeInfectedInPast(numDays: number, addr: AddressType) {
  return getInfectionRate(addr) * numDays;
}

export { listStates, listCounties, getPop, getInfectionCount, getInfectionRate, chanceToBeInfectedInPast }