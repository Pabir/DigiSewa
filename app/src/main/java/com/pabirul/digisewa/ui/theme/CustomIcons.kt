package com.pabirul.digisewa.ui.theme

import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathFillType
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.dp

object CustomIcons {
    val EyeWithEyelashesOpen: ImageVector
        get() = ImageVector.Builder(
            name = "EyeWithEyelashesOpen",
            defaultWidth = 24.0.dp,
            defaultHeight = 24.0.dp,
            viewportWidth = 24.0f,
            viewportHeight = 24.0f
        ).apply {
            // Main Eye Outline
            path(
                fill = SolidColor(Color.Black),
                fillAlpha = 1.0f,
                strokeAlpha = 1.0f,
                strokeLineWidth = 0.0f,
                strokeLineCap = StrokeCap.Butt,
                strokeLineJoin = StrokeJoin.Miter,
                strokeLineMiter = 4.0f,
                pathFillType = PathFillType.NonZero
            ) {
                moveTo(12.0f, 6.0f)
                curveTo(7.0f, 6.0f, 2.73f, 9.11f, 1.0f, 13.5f)
                curveTo(2.73f, 17.89f, 7.0f, 21.0f, 12.0f, 21.0f)
                curveTo(17.0f, 21.0f, 21.27f, 17.89f, 23.0f, 13.5f)
                curveTo(21.27f, 9.11f, 17.0f, 6.0f, 12.0f, 6.0f)
                close()
                moveTo(12.0f, 18.5f)
                curveTo(9.24f, 18.5f, 7.0f, 16.26f, 7.0f, 13.5f)
                curveTo(7.0f, 10.74f, 9.24f, 8.5f, 12.0f, 8.5f)
                curveTo(14.76f, 8.5f, 17.0f, 10.74f, 17.0f, 13.5f)
                curveTo(17.0f, 16.26f, 14.76f, 18.5f, 12.0f, 18.5f)
                close()
                moveTo(12.0f, 10.5f)
                curveTo(10.34f, 10.5f, 9.0f, 11.84f, 9.0f, 13.5f)
                curveTo(9.0f, 15.16f, 10.34f, 16.5f, 12.0f, 16.5f)
                curveTo(13.66f, 16.5f, 15.0f, 15.16f, 15.0f, 13.5f)
                curveTo(15.0f, 11.84f, 13.66f, 10.5f, 12.0f, 10.5f)
                close()
            }
        }.build()

    val EyeWithEyelashesClosed: ImageVector
        get() = ImageVector.Builder(
            name = "EyeWithEyelashesClosed",
            defaultWidth = 24.0.dp,
            defaultHeight = 24.0.dp,
            viewportWidth = 24.0f,
            viewportHeight = 24.0f
        ).apply {
            // Closed Eye Curve
            path(
                stroke = SolidColor(Color.Black),
                strokeLineWidth = 2.0f,
                strokeLineCap = StrokeCap.Round,
                strokeLineJoin = StrokeJoin.Round
            ) {
                moveTo(3.0f, 10.0f)
                curveTo(3.0f, 10.0f, 7.5f, 16.0f, 12.0f, 16.0f)
                curveTo(16.5f, 16.0f, 21.0f, 10.0f, 21.0f, 10.0f)
            }
            // Eyelashes
            path(
                stroke = SolidColor(Color.Black),
                strokeLineWidth = 1.5f,
                strokeLineCap = StrokeCap.Round
            ) {
                // Center
                moveTo(12.0f, 16.0f)
                lineTo(12.0f, 19.0f)
                // Left
                moveTo(8.0f, 14.8f)
                lineTo(7.0f, 17.5f)
                moveTo(5.0f, 12.5f)
                lineTo(3.5f, 15.0f)
                // Right
                moveTo(16.0f, 14.8f)
                lineTo(17.0f, 17.5f)
                moveTo(19.0f, 12.5f)
                lineTo(20.5f, 15.0f)
            }
        }.build()
}
