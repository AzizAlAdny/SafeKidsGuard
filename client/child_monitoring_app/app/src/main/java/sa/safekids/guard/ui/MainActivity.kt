package sa.safekids.guard.ui

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Process
import android.provider.Settings
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import sa.safekids.guard.R
import sa.safekids.guard.data.SessionManager
import sa.safekids.guard.network.AccessAppealRequestDto
import sa.safekids.guard.network.ApiClient
import sa.safekids.guard.network.PairDeviceRequestDto
import sa.safekids.guard.network.UnpairDeviceRequestDto
import sa.safekids.guard.service.MonitoringAccessibilityService
import sa.safekids.guard.service.PolicyEvaluator
import sa.safekids.guard.ui.theme.*

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private var showBlockScreenState by mutableStateOf(false)
    private var blockedCategoryState by mutableStateOf("")
    private var blockedReasonState by mutableStateOf("")
    private var blockedAppState by mutableStateOf("")
    private var blockedAlertIdState by mutableStateOf<String?>(null)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        extractBlockIntentExtras(intent)

        setContent {
            SafeKidsGuardTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ChildAppHomeScreen(
                        showBlockOverlay = showBlockScreenState,
                        blockedCategory = blockedCategoryState,
                        blockedReason = blockedReasonState,
                        blockedApp = blockedAppState,
                        blockedAlertId = blockedAlertIdState,
                        onDismissBlockOverlay = { showBlockScreenState = false },
                        onOpenAccessibilitySettings = {
                            startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS))
                        },
                        onOpenUsageSettings = {
                            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
                        }
                    )
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        extractBlockIntentExtras(intent)
    }

    private fun extractBlockIntentExtras(intent: Intent?) {
        if (intent?.getBooleanExtra("EXTRA_SHOW_BLOCK_SCREEN", false) == true) {
            showBlockScreenState = true
            blockedCategoryState = intent.getStringExtra("EXTRA_BLOCKED_CATEGORY") ?: "UNSAFE"
            blockedReasonState = intent.getStringExtra("EXTRA_BLOCKED_REASON") ?: "تم إيقاف المحتوى لحمايتك"
            blockedAppState = intent.getStringExtra("EXTRA_BLOCKED_APP") ?: ""
            blockedAlertIdState = intent.getStringExtra("EXTRA_ALERT_ID")
        }
    }
}

@Composable
fun ChildAppHomeScreen(
    showBlockOverlay: Boolean = false,
    blockedCategory: String = "",
    blockedReason: String = "",
    blockedApp: String = "",
    blockedAlertId: String? = null,
    onDismissBlockOverlay: () -> Unit = {},
    onOpenAccessibilitySettings: () -> Unit,
    onOpenUsageSettings: () -> Unit
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val scope = rememberCoroutineScope()
    val sessionManager = remember { SessionManager.getInstance(context) }

    var pairingPin by remember { mutableStateOf("") }
    var isPaired by remember { mutableStateOf(sessionManager.isPaired) }
    var isPairingLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var serverUrl by remember { mutableStateOf(sessionManager.baseUrl) }
    var showServerConfig by remember { mutableStateOf(false) }

    var isAccessibilityEnabled by remember {
        mutableStateOf(isAccessibilityServiceEnabled(context))
    }
    var isUsageStatsGranted by remember {
        mutableStateOf(isUsageStatsPermissionGranted(context))
    }

    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                isAccessibilityEnabled = isAccessibilityServiceEnabled(context)
                isUsageStatsGranted = isUsageStatsPermissionGranted(context)
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose {
            lifecycleOwner.lifecycle.removeObserver(observer)
        }
    }

    // Protected unpair dialog state
    var showUnpairDialog by remember { mutableStateOf(false) }
    var parentPassword by remember { mutableStateOf("") }
    var isAppealSent by remember(blockedAlertId, blockedCategory) { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Image(
            painter = painterResource(id = R.drawable.ic_logo),
            contentDescription = "Safe Kids Guard Official Logo",
            modifier = Modifier
                .size(92.dp)
                .clip(RoundedCornerShape(22.dp)),
            contentScale = ContentScale.Fit
        )

        Spacer(modifier = Modifier.height(20.dp))

        Text(
            text = "حارس الأطفال الآمن",
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold,
            color = YaleBlue800,
            textAlign = TextAlign.Center
        )

        Text(
            text = "Safe Kids Guard - تطبيق حماية جهاز الطفل",
            fontSize = 13.sp,
            color = AliceBlue600,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 4.dp, bottom = 20.dp)
        )

        // Block Intervention Overlay Card + Request Access Appeal (UC-C5)
        if (showBlockOverlay) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF1F2)),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Security,
                        contentDescription = "Blocked",
                        tint = DangerRed,
                        modifier = Modifier.size(44.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "تم حظر المحتوى لحمايتك",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = DangerRed
                    )
                    Text(
                        text = blockedReason,
                        fontSize = 13.sp,
                        color = YaleBlue800,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedButton(
                            onClick = {
                                if (!isAppealSent && sessionManager.childId.isNotBlank()) {
                                    scope.launch {
                                        try {
                                            val api = ApiClient.getApiService(context)
                                            val resp = api.requestAccessAppeal(
                                                "Bearer ${sessionManager.accessToken}",
                                                AccessAppealRequestDto(
                                                    child_id = sessionManager.childId,
                                                    alert_id = blockedAlertId,
                                                    reason = "طلب السماح بالوصول (${blockedCategory})",
                                                    context_app = blockedApp
                                                )
                                            )
                                            if (resp.isSuccessful) {
                                                isAppealSent = true
                                                Toast.makeText(
                                                    context,
                                                    "تم إرسال طلب المراجعة لولي الأمر بنجاح",
                                                    Toast.LENGTH_SHORT
                                                ).show()
                                            }
                                        } catch (_: Exception) {
                                            Toast.makeText(
                                                context,
                                                "تعذر إرسال الطلب حالياً",
                                                Toast.LENGTH_SHORT
                                            ).show()
                                        }
                                    }
                                }
                            },
                            enabled = !isAppealSent,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text(if (isAppealSent) "تم إرسال الطلب ✓" else "طلب السماح (Appeal)")
                        }

                        Button(
                            onClick = onDismissBlockOverlay,
                            colors = ButtonDefaults.buttonColors(containerColor = YaleBlue800),
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Text("حسناً، فهمت")
                        }
                    }
                }
            }
        }

        if (!isPaired) {
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "أدخل رمز اقتران ولي الأمر",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = YaleBlue800
                    )
                    Text(
                        text = "احصل على الرمز المكون من 6 أرقام من لوحة تحكم الأهل",
                        fontSize = 12.sp,
                        color = AliceBlue600,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )

                    OutlinedTextField(
                        value = pairingPin,
                        onValueChange = {
                            if (it.length <= 7) pairingPin = it
                            errorMessage = null
                        },
                        placeholder = { Text("000-000") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    if (errorMessage != null) {
                        Text(
                            text = errorMessage!!,
                            color = DangerRed,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            if (!PolicyEvaluator.isValidPairingPin(pairingPin)) {
                                errorMessage = "يرجى إدخال رمز رقمي صحيح مكون من 6 أرقام"
                                return@Button
                            }
                            val cleanedPin = PolicyEvaluator.sanitizePairingPin(pairingPin)
                            isPairingLoading = true
                            errorMessage = null
                            scope.launch {
                                try {
                                    val api = ApiClient.getApiService(context)
                                    val resp = api.pairDevice(PairDeviceRequestDto(pairing_pin = cleanedPin))
                                    if (resp.isSuccessful && resp.body() != null) {
                                        val body = resp.body()!!
                                        sessionManager.saveSession(
                                            childId = body.child_id,
                                            childName = body.child_name,
                                            accessToken = body.access_token,
                                            refreshToken = body.refresh_token
                                        )
                                        // Fetch initial policy right after pairing
                                        try {
                                            val policyResp = api.getPolicy(
                                                "Bearer ${body.access_token}",
                                                body.child_id
                                            )
                                            policyResp.body()?.let { sessionManager.cachePolicy(it) }
                                        } catch (_: Exception) {}

                                        isPaired = true
                                        showServerConfig = false
                                    } else {
                                        errorMessage = "رمز الاقتران غير صحيح أو منتهي الصلاحية"
                                    }
                                } catch (e: Exception) {
                                    errorMessage = "تعذر الاتصال بالخادم. تحقق من الشبكة أو عنوان الخادم."
                                } finally {
                                    isPairingLoading = false
                                }
                            }
                        },
                        enabled = !isPairingLoading,
                        colors = ButtonDefaults.buttonColors(containerColor = BlueGreen500),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            if (isPairingLoading) "جاري التحقق والربط..." else "ربط وتفعيل الحماية",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        } else {
            val protectionFullyReady = isAccessibilityEnabled
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = if (protectionFullyReady) Color(0xFFEAF9EF) else Color(0xFFFFF8E6)
                ),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = if (protectionFullyReady) Icons.Default.CheckCircle else Icons.Default.Warning,
                        contentDescription = if (protectionFullyReady) "Active" else "Permission Required",
                        tint = if (protectionFullyReady) Emerald500 else WarningOrange,
                        modifier = Modifier.size(44.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = if (protectionFullyReady) {
                            "الحماية مفعلة ونشطة (${sessionManager.childName})"
                        } else {
                            "الجهاز مقترن — يرجى تفعيل إمكانية الوصول (${sessionManager.childName})"
                        },
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = if (protectionFullyReady) Color(0xFF1A6F2F) else Color(0xFF9A5B00),
                        textAlign = TextAlign.Center
                    )
                    Text(
                        text = if (protectionFullyReady) {
                            "الجهاز مقترن بنجاح ويتم فحص النصوص وتطبيق سياسات الحماية وأوقات النوم تلقائياً."
                        } else {
                            "لتشغيل الفحص الفوري وحظر المحتوى الضار، يرجى تفعيل خدمة إمكانية الوصول من الزر أدناه."
                        },
                        fontSize = 12.sp,
                        color = YaleBlue800,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                    Text(
                        text = "الخادم: ${sessionManager.baseUrl}",
                        fontSize = 11.sp,
                        color = AliceBlue600,
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            OutlinedButton(
                onClick = onOpenAccessibilitySettings,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    if (isAccessibilityEnabled) {
                        "إعدادات إمكانية الوصول (مفعل ✓)"
                    } else {
                        "إعدادات إمكانية الوصول (غير مفعل ⚠️ - اضغط للتفعيل)"
                    }
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedButton(
                onClick = onOpenUsageSettings,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    if (isUsageStatsGranted) {
                        "إذن إحصائيات استخدام التطبيقات (مفعل ✓)"
                    } else {
                        "إذن إحصائيات استخدام التطبيقات (غير مفعل ⚠️)"
                    }
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            TextButton(
                onClick = {
                    parentPassword = ""
                    showUnpairDialog = true
                }
            ) {
                Text("إلغاء الاقتران (يتطلب كلمة مرور ولي الأمر)", color = DangerRed)
            }
        }

        // Parent Password Verification Dialog for Unpairing (VULN-02 remediation)
        if (showUnpairDialog) {
            AlertDialog(
                onDismissRequest = { showUnpairDialog = false },
                title = { Text("تأكيد ولي الأمر لإلغاء الاقتران", fontWeight = FontWeight.Bold) },
                text = {
                    Column {
                        Text(
                            "يرجى إدخال كلمة مرور حساب ولي الأمر لإلغاء ربط الجهاز وإيقاف الحماية:",
                            fontSize = 13.sp,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        OutlinedTextField(
                            value = parentPassword,
                            onValueChange = { parentPassword = it },
                            visualTransformation = PasswordVisualTransformation(),
                            singleLine = true,
                            placeholder = { Text("كلمة مرور ولي الأمر") },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                },
                confirmButton = {
                    Button(
                        onClick = {
                            if (parentPassword.isNotBlank()) {
                                scope.launch {
                                    try {
                                        val api = ApiClient.getApiService(context)
                                        val resp = api.unpairDevice(
                                            "Bearer ${sessionManager.accessToken}",
                                            UnpairDeviceRequestDto(parent_password = parentPassword)
                                        )
                                        if (resp.isSuccessful) {
                                            sessionManager.clearSession()
                                            isPaired = false
                                            showUnpairDialog = false
                                            Toast.makeText(context, "تم إلغاء الاقتران بنجاح", Toast.LENGTH_SHORT).show()
                                        } else {
                                            Toast.makeText(context, "كلمة مرور ولي الأمر غير صحيحة", Toast.LENGTH_SHORT).show()
                                        }
                                    } catch (_: Exception) {
                                        Toast.makeText(context, "تعذر التحقق من الخادم", Toast.LENGTH_SHORT).show()
                                    }
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = DangerRed)
                    ) {
                        Text("تأكيد الإلغاء")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showUnpairDialog = false }) {
                        Text("تراجع")
                    }
                }
            )
        }

        Spacer(modifier = Modifier.height(16.dp))

        TextButton(
            onClick = { showServerConfig = !showServerConfig }
        ) {
            Text(
                text = if (showServerConfig) "إخفاء إعدادات اتصال الخادم" else "إعدادات اتصال الخادم (للمطورين)",
                fontSize = 12.sp,
                color = BlueGreen500
            )
        }

        if (showServerConfig) {
            Card(
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 8.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "عنوان خادم Safe Kids Guard API:",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = YaleBlue800
                    )
                    Text(
                        text = if (isPaired) {
                            "🔒 لا يمكن تعديل عنوان الخادم أثناء اقتران الجهاز (يتطلب إلغاء الاقتران بكلمة مرور ولي الأمر)"
                        } else {
                            "محاكي أندرويد: http://10.0.2.2:8000/\nجهاز حقيقي: عنوان الـ IP المحلي لجهازك"
                        },
                        fontSize = 11.sp,
                        color = if (isPaired) WarningOrange else AliceBlue600,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                    OutlinedTextField(
                        value = serverUrl,
                        onValueChange = {
                            if (!isPaired) {
                                serverUrl = it
                                sessionManager.baseUrl = it
                            }
                        },
                        enabled = !isPaired,
                        readOnly = isPaired,
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }
        }
    }
}

/**
 * Checks whether MonitoringAccessibilityService is enabled in Android system settings.
 */
private fun isAccessibilityServiceEnabled(context: Context): Boolean {
    return try {
        val enabledServices = Settings.Secure.getString(
            context.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false
        val serviceName = MonitoringAccessibilityService::class.java.canonicalName ?: return false
        enabledServices.contains("${context.packageName}/$serviceName") ||
            enabledServices.contains(serviceName)
    } catch (_: Exception) {
        false
    }
}

/**
 * Checks whether PACKAGE_USAGE_STATS permission has been granted in Android Usage Access settings.
 */
private fun isUsageStatsPermissionGranted(context: Context): Boolean {
    return try {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager ?: return false
        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }
        mode == AppOpsManager.MODE_ALLOWED
    } catch (_: Exception) {
        false
    }
}
