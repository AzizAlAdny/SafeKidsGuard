package sa.safekids.guard.ui

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Smartphone
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import dagger.hilt.android.AndroidEntryPoint
import sa.safekids.guard.R
import sa.safekids.guard.data.SessionManager
import sa.safekids.guard.ui.theme.*

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SafeKidsGuardTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ChildAppHomeScreen(
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
}

@Composable
fun ChildAppHomeScreen(
    onOpenAccessibilitySettings: () -> Unit,
    onOpenUsageSettings: () -> Unit
) {
    val context = LocalContext.current
    val sessionManager = remember { SessionManager.getInstance(context) }

    var pairingPin by remember { mutableStateOf("") }
    var isPaired by remember { mutableStateOf(sessionManager.isPaired) }
    var serverUrl by remember { mutableStateOf(sessionManager.baseUrl) }
    var showServerConfig by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // App Official Brand Logo
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
            modifier = Modifier.padding(top = 4.dp, bottom = 24.dp)
        )

        if (!isPaired) {
            // Pairing Card
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
                        onValueChange = { if (it.length <= 6) pairingPin = it },
                        placeholder = { Text("000-000") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Button(
                        onClick = {
                            if (pairingPin.isNotEmpty()) {
                                sessionManager.saveSession(
                                    childId = "00000000-0000-0000-0000-000000000001",
                                    childName = "جهاز الطفل",
                                    accessToken = "mock_child_token"
                                )
                                isPaired = true
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = BlueGreen500),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("ربط وتفعيل الحماية", fontWeight = FontWeight.Bold)
                    }
                }
            }
        } else {
            // Protection Active Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFEAF9EF)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = "Active",
                        tint = Emerald500,
                        modifier = Modifier.size(44.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "الحماية مفعلة ونشطة",
                        fontWeight = FontWeight.Bold,
                        fontSize = 18.sp,
                        color = Color(0xFF1A6F2F)
                    )
                    Text(
                        text = "الجهاز مقترن بنجاح ويتم فحص النصوص بالذكاء الاصطناعي (مع تقنية منع التكرار 2 ثوانٍ) لحماية طفلك.",
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

            // Permissions Buttons
            OutlinedButton(
                onClick = onOpenAccessibilitySettings,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("إعدادات إمكانية الوصول (Accessibility)")
            }

            Spacer(modifier = Modifier.height(8.dp))

            OutlinedButton(
                onClick = onOpenUsageSettings,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("إذن إحصائيات استخدام التطبيقات")
            }

            Spacer(modifier = Modifier.height(8.dp))

            TextButton(
                onClick = {
                    sessionManager.clearSession()
                    isPaired = false
                }
            ) {
                Text("إلغاء الاقتران / إعادة التعيين", color = DangerRed)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Advanced Server Connection Settings
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
                        text = "محاكي أندرويد: http://10.0.2.2:8000/\nجهاز حقيقي: عنوان الـ IP المحلي لجهازك",
                        fontSize = 11.sp,
                        color = AliceBlue600,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                    OutlinedTextField(
                        value = serverUrl,
                        onValueChange = {
                            serverUrl = it
                            sessionManager.baseUrl = it
                        },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(8.dp)
                    )
                }
            }
        }
    }
}
