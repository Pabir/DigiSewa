package com.pabirul.digisewa.ui.components

import android.app.Activity
import android.content.Context
import android.util.Log
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback

object AdMobHelper {
    private var mInterstitialAd: InterstitialAd? = null
    private var mRewardedAd: RewardedAd? = null
    private const val TAG = "AdMobHelper"

    // Real Ad Unit IDs
    private const val INTERSTITIAL_ID = "ca-app-pub-2638459468563062/5686353780"
    private const val REWARDED_ID = "ca-app-pub-2638459468563062/7079326504"

    fun loadInterstitial(context: Context) {
        val adRequest = AdRequest.Builder().build()
        InterstitialAd.load(context, INTERSTITIAL_ID, adRequest, object : InterstitialAdLoadCallback() {
            override fun onAdFailedToLoad(adError: LoadAdError) {
                Log.d(TAG, "Interstitial failed to load: ${adError.message}")
                mInterstitialAd = null
            }

            override fun onAdLoaded(interstitialAd: InterstitialAd) {
                Log.d(TAG, "Interstitial Ad was loaded.")
                mInterstitialAd = interstitialAd
            }
        })
    }

    fun showInterstitial(activity: Activity, onDismiss: () -> Unit = {}) {
        if (mInterstitialAd != null) {
            mInterstitialAd?.show(activity)
            mInterstitialAd = null // Clear so it can be reloaded
            loadInterstitial(activity) // Preload the next one
            onDismiss()
        } else {
            Log.d(TAG, "The interstitial ad wasn't ready yet.")
            onDismiss()
        }
    }

    fun loadRewardedAd(context: Context) {
        val adRequest = AdRequest.Builder().build()
        RewardedAd.load(context, REWARDED_ID, adRequest, object : RewardedAdLoadCallback() {
            override fun onAdFailedToLoad(adError: LoadAdError) {
                Log.d(TAG, "Rewarded Ad failed to load: ${adError.message}")
                mRewardedAd = null
            }

            override fun onAdLoaded(rewardedAd: RewardedAd) {
                Log.d(TAG, "Rewarded Ad was loaded.")
                mRewardedAd = rewardedAd
            }
        })
    }

    fun showRewardedAd(activity: Activity, onRewardEarned: (Int) -> Unit) {
        if (mRewardedAd != null) {
            mRewardedAd?.show(activity) { rewardItem ->
                val rewardAmount = rewardItem.amount
                Log.d(TAG, "User earned the reward: $rewardAmount")
                onRewardEarned(rewardAmount)
            }
            mRewardedAd = null
            loadRewardedAd(activity) // Preload the next one
        } else {
            Log.d(TAG, "The rewarded ad wasn't ready yet.")
        }
    }
}
