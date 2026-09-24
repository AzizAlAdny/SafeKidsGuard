package sa.safekids.guard

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class SafeKidsGuardApp : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}
