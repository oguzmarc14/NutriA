package com.nutria.app;

import android.os.CancellationSignal;
import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

@CapacitorPlugin(name = "NutriaGoogleSignIn")
public class NutriaGoogleSignIn extends Plugin {
    @PluginMethod
    public void signIn(PluginCall call) {
        String clientId = call.getString("serverClientId");
        if (clientId == null || clientId.trim().isEmpty()) {
            call.reject("Falta configurar el cliente de Google.");
            return;
        }

        GetCredentialRequest request = new GetCredentialRequest.Builder()
            .addCredentialOption(new GetSignInWithGoogleOption.Builder(clientId).build())
            .build();

        CredentialManager.create(getActivity()).getCredentialAsync(
            getActivity(), request, new CancellationSignal(),
            ContextCompat.getMainExecutor(getActivity()),
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse response) {
                    Credential credential = response.getCredential();
                    if (!(credential instanceof CustomCredential)
                        || !GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                        call.reject("Google devolvió una credencial inesperada.");
                        return;
                    }
                    String token;
                    try {
                        token = GoogleIdTokenCredential.createFrom(credential.getData()).getIdToken();
                    } catch (Exception error) {
                        call.reject("No se pudo leer la credencial de Google.");
                        return;
                    }
                    JSObject result = new JSObject();
                    result.put("idToken", token);
                    call.resolve(result);
                }

                @Override
                public void onError(GetCredentialException error) {
                    if (error instanceof GetCredentialCancellationException) {
                        call.reject("Se canceló el inicio de sesión.", "CANCELED");
                    } else {
                        call.reject("Android no pudo iniciar sesión con Google.");
                    }
                }
            }
        );
    }
}
