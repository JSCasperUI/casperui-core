import {LiveData} from "@casperui/core/live/LiveData";

export class LiveManager {
    isActive = false
    private liveDataRegistry:Set<LiveData<any>> = new Set()

    activate() {
        if (this.isActive) return
        this.isActive = true;
        this.refreshLiveData();
    }


    deactivate() {
        this.isActive = false;
    }

    registerLiveData(liveData:LiveData<any>) {
        this.liveDataRegistry.add(liveData);
    }


   private refreshLiveData() {
        if (this.isActive){
            this.liveDataRegistry.forEach(liveData => {
                liveData.notifyObserver(this);
            });
        }
    }
}