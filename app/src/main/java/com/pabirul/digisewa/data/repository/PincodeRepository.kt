package com.pabirul.digisewa.data.repository

import com.pabirul.digisewa.data.api.PincodeService
import com.pabirul.digisewa.data.model.PincodeResponseItem
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.security.SecureRandom
import java.security.cert.X509Certificate
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManager
import javax.net.ssl.X509TrustManager

class PincodeRepository {
    
    // Create an unsafe OkHttpClient that ignores SSL certificate errors
    // Required because api.postalpincode.in has a broken certificate chain
    private fun getUnsafeOkHttpClient(): OkHttpClient {
        return try {
            val trustAllCerts = arrayOf<TrustManager>(
                object : X509TrustManager {
                    override fun checkClientTrusted(chain: Array<X509Certificate>, authType: String) {}
                    override fun checkServerTrusted(chain: Array<X509Certificate>, authType: String) {}
                    override fun getAcceptedIssuers(): Array<X509Certificate> = arrayOf()
                }
            )

            val sslContext = SSLContext.getInstance("SSL")
            sslContext.init(null, trustAllCerts, SecureRandom())
            
            OkHttpClient.Builder()
                .sslSocketFactory(sslContext.socketFactory, trustAllCerts[0] as X509TrustManager)
                .hostnameVerifier { _, _ -> true }
                .build()
        } catch (e: Exception) {
            OkHttpClient()
        }
    }

    private val retrofit = Retrofit.Builder()
        .baseUrl("https://api.postalpincode.in/")
        .client(getUnsafeOkHttpClient())
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val service = retrofit.create(PincodeService::class.java)

    suspend fun getPincodeDetails(pincode: String): Result<List<PincodeResponseItem>> {
        return try {
            val response = service.getPincodeDetails(pincode)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
