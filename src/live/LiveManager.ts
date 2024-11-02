import {LiveData} from "@casperui/core/live/LiveData";

export class LiveManager {
    private mIsActive = false
    private liveDataRegistry:Set<LiveData<any>> = new Set()
    activate() {
        if (this.mIsActive) return
        this.mIsActive = true;
        this.refreshLiveData();
    }


    hasActive(){
          return this.mIsActive
    }
    deactivate() {
        this.mIsActive = false;
    }

    registerLiveData(liveData:LiveData<any>) {
        this.liveDataRegistry.add(liveData);
    }


   private refreshLiveData() {
        if (this.mIsActive){
            this.liveDataRegistry.forEach(liveData => {
                liveData.notifyObserver(this);
            });
        }
    }
}