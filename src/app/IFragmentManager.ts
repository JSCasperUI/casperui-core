import {JFragment} from "@casperui/core/app/JFragment";
import {View} from "@casperui/core/view/View";
import {FragmentManager} from "@casperui/core/app/FragmentManager";

export type FragmentMemory = Map<number,JFragment>;

export function createFragmentMemory():FragmentMemory {
    return new Map()
}

export interface IFragmentManager {
    getFragmentMemory():FragmentMemory
    getView():View
    getFragmentManager():FragmentManager
}