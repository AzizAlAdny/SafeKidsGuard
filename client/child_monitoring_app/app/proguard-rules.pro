# Safe Kids Guard — ProGuard / R8 Rules for Release Builds

# Keep Retrofit / Gson DTO data classes from field obfuscation
-keep class sa.safekids.guard.network.** { *; }

# Keep Gson generic type signatures
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class com.google.gson.reflect.TypeToken { *; }
-keep class * extends com.google.gson.reflect.TypeToken

# Retrofit 2 & OkHttp 4 rules
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase
